import json
import argparse
import torch
import numpy as np
import pandas as pd
from torch.utils.data import DataLoader

from multi_k_model import MultiKModel
from model import Predictor
from iterator import ForeverDataIterator

device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")

class DataWrapper:
    def __init__(self, data, transform=None):
        self.data = data
        self.transform = transform

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        if torch.is_tensor(idx):
            idx = idx.to_list()

        res = torch.tensor(self.data[idx], dtype=torch.float)
        return res

class DataManager:
    def __init__(self, batch_size, kmer, path):

        self.batch_size = batch_size
        self.kmer = kmer
        self.path = path
        self.DNA2Vec = MultiKModel(f"{path}/dna2vec.w2v")

    def k_mer_stride(self, seq, k, s):
        l = []
        j = 0
        for i in range(len(seq)):
            t = seq[j:j + k]
            if (len(t)) == k:
                vec = self.DNA2Vec.vector(t)
                l.append(vec)
            j += s
        return l

    def data_loader(self, data):

        loader = DataLoader(
            DataWrapper(data),
            batch_size=self.batch_size,
            num_workers=8,
            drop_last=False,
        )
        return loader

    def load_file(self):

        with open(f"{self.path}/candidate_grna.json", 'r') as t:
            object = json.load(t)
        
        self.df = pd.DataFrame(object, columns = ['sequence', 'pos_st','pos_ed','strand'])
        dvec = [np.array(self.k_mer_stride(''.join(self.df['sequence'][i]), self.kmer, 1)).T for i in range(len(self.df['sequence']))]
        self.loader = ForeverDataIterator(DM.data_loader(dvec))

    def run(self):

        retlist = []
        model.eval()
        with torch.no_grad():
            for i in range(len(self.loader)):
                E = next(self.loader)
                E = E.to(device)
                outputs = model(E)
                retlist += outputs.cpu().detach().numpy().tolist()
        
        self.df['score'] = retlist
        
        pd.set_option('display.width', 1000)
        pd.set_option('colheader_justify', 'center')

        self.df.to_html(f"{self.path}/grna_results.html")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--path", type=str, help="Data directory path")
    parser.add_argument("--cas", type=str, help="Cas protein", default="Cas9")
    args = parser.parse_args()

    if args.cas == "Cas9":
        model_path = f"{args.path}/cas9_daco.pth"
    else:
        model_path = f"{args.path}/cas12a_daco.pth"

    model = Predictor(input_channel = 100).to(device)
    model.load_state_dict(torch.load(model_path))

    DM = DataManager(batch_size=512, kmer = 5, path = args.path)
    DM.load_file()
    DM.run()