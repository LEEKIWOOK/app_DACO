import sys
import yaml
import argparse
import pyensembl
import pandas as pd
from pyfaidx import Fasta

class Configuration:
    def __init__(self, args):
        conf = "./config.yaml"
        with open(conf) as yml:
            conf = yaml.load(yml, Loader=yaml.FullLoader)
        db = conf["DATABASE"]
        
        self.gene = args.gene
        self.cas = args.cas

        self.filepath = {
            'outdir': f"%s" % db['outdir'],
            'ensembl': f"%s/%s" % (db['root'], db['ensembl']),
            'valid_grna': f"%s/%s" % (db['root'], db['valid']),
            'ref': f"%s/%s" % (db['root'], db['ref']),
            'kovar_dir': f"%s/%s" % (db['root'], db['kovar']),
            'dbsnp': f"%s/%s" % (db['root'], db['dbsnp']),
        }
    
    def gene_to_ensembl(self):
        
        ens = pyensembl.Database(self.filepath['ensembl'])._load_gtf_as_dataframe()
        df = ens.loc[ens['gene_name'] == self.gene]
        if len(df) == 0:
            print("Not suitable.")
            sys.exit(-1)
        else:
            return df

    def search_db(self, df):

        tr_id = list(filter(None, set(df['transcript_id'])))

        valdb = pd.read_csv(self.filepath['valid_grna'], sep=',', header=None)
        valdb.columns = ["guide_rna", "crispr_system", "reference", "chromosme", "start", "end", "insilico_grna_predict_score(sgrnascorer)", "insilico_grna_predict_score(rule_set_2)", "guide_scan_off", "forecast_predict_score", "in_protein_coding_exon", "transcript_id_list", "transcript_id", "sources"]
        valdb = valdb[valdb['transcript_id_list'].notna()]

        ret = []
        for k in tr_id:
            ret.append(valdb[valdb['transcript_id_list'].str.contains(k, regex=False)])
        
        ret = pd.concat(ret)
        if len(ret) == 0:
            print("Nothing.")
        else:
            print("save valid grna list.")
            ret.to_excel(f"%s/validated_grna.xlsx" % self.filepath['outdir'])

            
        
    def load_seq(self, df):

        df = df.loc[df['feature'] == "CDS"]
        chrom = f"chr"+df['seqname'].iloc[0]

        seq = Fasta(self.filepath['ref'])
        retseq = list()

        for idx, row in df.iterrows():
            position = slice(row['start'], row['end'])
            retseq.append(seq[chrom][position].seq)

        
        for k in retseq:
            
            

        


if __name__ == "__main__":
    """
        < Pipeline >
            (1) Gene to ensembl transcript id
                Input : Gene name
                Return : Ensembl transcript name

            (2) Search validated grna
                Input : Transcript id list
                Return : guideRNA lists or NULL

            (3) Load reference sequence
                Input : Transcript id list
                Return : Reference sequence list

            (4) guideRNA search
                Input : Reference sequence list
                Return : guideRNA lists per transcript list
            
            (5) guideRNA scoring
                Input : guideRNA lists
                Return  : csv file

            (6) Annotation polymorphism and variants
                Input : csv file
                Return : Excel file
    """

    parser = argparse.ArgumentParser()
    parser.add_argument("--gene", type=str, help="Gene name")
    parser.add_argument("--cas", type=str, help="cas9 or cas12a", default = "cas9")
    args = parser.parse_args()

    MF = Configuration(args)
    
    #1. Gene to ensembl transcript id
    df = MF.gene_to_ensembl()

    #2. Search validated grna
    MF.search_db(df)

    #3. Load reference sequence / guideRNA search
    grna = MF.load_seq(df)

