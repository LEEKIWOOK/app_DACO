process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

const electron = require("electron");
const { ipcMain } = require("electron");
const app = electron.app;
const jsonfile = require("jsonfile");
const BrowserWindow = electron.BrowserWindow;

const fastaToJson = require('bio-parsers').fastaToJson;
const fs = require("fs")
const func = require("./src/utils/func")
var exec = require("sync-exec");
var os = require("os")

let mainWindow = null;

app.on('window-all-closed', () => {
	if (process.platform != 'darwin') app.quit();
});

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 900,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
        }
    });
    //mainWindow.webContents.openDevTools();
    mainWindow.loadFile("index.html");
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
});

/*  HANDLE THE API CALLS FROM THE RENDERER PROCESS  */
var info_table = {
    'target_reference': '',
    'query_chromosome': '',
    'query_start': 0,
    'query_end': 0,
    'query_sequence': '',
    'query_reverse': '',
    'query_length': '',
    'query_information': '',
    'cas_protein': '',
    'cas_pam': '',
    'cas_spacerlen': 0
}
/*
var grna_table = {
    'num': [],
    'strand': [],
    'position': [],
    'sequence': [],
    'onscore': [],
    'offscore': [],
    'information': []
}
*/

ipcMain.on('get_app_path', function (event, data) {
	event.sender.send('send_app_path', app.getAppPath());
});

ipcMain.on('sent_dna_fa', function (event, data) {

    try {
        event.sender.send('test');
        fastaToJson(data, function (result){

            if (result[0]['messages'].length == 0){

                let dna = result[0]['parsedSequence']['sequence'].toUpperCase();
                info_table['query_sequence'] = dna;
                info_table['query_reverse'] = func.reverse_complement(dna, false, true);
                info_table['query_length'] = dna.length;
            }
        });
    } catch (error) {
        console.log(error);
        event.sender.send('gb_err')
    }
});

ipcMain.on('analyse', function (event, data) {

    info_table['target_reference'] = data['offtarget'];
    info_table['cas_protein'] = data['Cas_protein'];
    info_table['cas_pam'] = data['pam'];
    info_table['cas_spacerlen'] = data['grna_length'];

    if (os.platform() === 'darwin') {
        var blastPath = fs.realpathSync(app.getAppPath() + '/exonerate/exonerate_macos/bin/');
    } else if (os.platform() === 'win32') {
        var blastPath = fs.realpathSync(app.getAppPath() + '/exonerate/exonerate_win/bin/');
    } else {
        var blastPath = fs.realpathSync(app.getAppPath() + '/exonerate/exonerate_linux/bin/');
    }
    //------------------------ DACO path ------------------------
    var dacoPath = fs.realpathSync(app.getAppPath() + '/exonerate/daco_run');

    if(data.DS == true){
        info_table['query_sequence'] = dna;
        info_table['query_reverse'] = func.reverse_complement(dna, false, true);
        info_table['query_length'] = dna.length;
    }

    let tem_dna = '>dna\n' + info_table['query_sequence'];
    let query_file = app.getAppPath() + '/data/dna.fa'
    fs.writeFileSync(query_file, tem_dna, 'utf8');
    
    var ref = '';
    if(info_table['target_reference'] == "hg38"){
        ref = app.getAppPath() + "/data/hg38.fa";
    }else{
        //not supported yet.
    }
    var query_result = exec(blastPath + '/exonerate -m ungapped -Q dna -q ' + query_file + '-T dna -t '+ ref + '--bestn 1 --showquerygff -S false --percent 99.0 --softmasktarget TRUE').stdout;

    var threshold = -1;
    for (let i in query_result.split(';')) {
        if(query_result.split(';')[i].split(' ')[1] == "Target" && info_table['query_start'] == 0){
            info_table['query_chromosome'] = query_result.split(';')[i].split(' ')[2];

        }else if (func.trim(query_result.split(';')[i]).split(' ')[0] === "Align") {
            var start = Number(func.trim(query_result.split(';')[i]).split(' ')[2]);
            if (start > threshold) {
                threshold = start
            } else {
                break
            }
            var span_len = Number(func.trim(query_result.split(';')[i]).split(' ')[3]);
            var end = start + span_len - 1;

            if(info_table['query_start'] == 0){
                info_table['query_start'] = start - 1;
                info_table['query_end'] = end - 1;
            }
        }
    }
    var is_cpf1 = '';
    var cas_protein = '';
    var skip_func = false;

    if (info_table['cas_pam'] == 'NGG'){
        is_cpf1 = false;
        cas_protein = "Cas9";

    }else if(info_table['cas_pam'] == "TTTN"){
        is_cpf1 = true;
        cas_protein = "Cas12a";
    }
    if(skip_func == false && (is_cpf1 == true || is_cpf1 == false)){

        var grnafile = app.getAppPath() + "/data/candidate_grna.json"
        var infofile = app.getAppPath() + "/data/query_info.json"

        var grna_info = func.find_grna(info_table['query_sequence'], info_table['cas_pam'], info_table['cas_spacerlen'], is_cpf1);
        
        //------------------------ DACO result to json ------------------------
        jsonfile.writeFileSync(infofile, info_table);
        jsonfile.writeFileSync(grnafile, grna_info);

        exec(dacoPath + '--cas ' + cas_protein + ' --path ' + grnafile);
    }
});