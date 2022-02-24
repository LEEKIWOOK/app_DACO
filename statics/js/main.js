// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
var form_info = {'dna_sequence': 1, 'pam':'', 'grna_length':'', 'DS': false, 'DF':false, 'FA':false, 'database':''};
const snapgeneToJson = require('bio-parsers').snapgeneToJson;
const fs = require("fs");
const wget = require('wget-improved');
const func = require('./func');

const electron = require('electron');
var remote = require('electron').remote;
const Menu = remote.Menu;

$(document).ready(function(){

    var template = [
        {
            label: 'Copy',
            role: 'Copy',
            accelerator: 'CommandOrControl+C',
        },
        {
            label: 'Paste',
            role: 'Paste',
            accelerator: 'CommandOrControl+V',
        },
    ]

    var m = Menu.buildFromTemplate(template);

    Menu.setApplicationMenu(m);

    window.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        m.popup({
            window: remote.getCurrentWindow()
        })
    }, false)

    ipcRenderer.send('get_app_path', '');

    ipcRenderer.on('send_app_path', function (event, data) {
        app_path = data

        fs.readdir(app_path + '/offtarget_info/', function (err, files) {
            if (err) {console.log('read file direction failed')}
            else {
                for (let i in files){
                    if (files[i].indexOf('json') != -1) {
                        $("#offtarget").append("<option value="+files[i]+">"+offtarget_file_table(files[i])+" </option>");
                    }
                }
            }
        });
        
    });


    $("#genbank_option").click(function () {
        if($("#snapgene_content").css("display")==='block') {
            $("#snapgene_content").slideToggle("slow");
        }
        if($("#fasta_content").css("display")==='block') {
            $("#fasta_content").slideToggle("slow");
        }
        if($("#genbank_content").css("display")==='none') {
            $("#genbank_content").slideToggle("slow");
        }

        $('#gb_file').prop("disabled", false);
        $('#sg_file').prop("disabled", true);
        $('#dna_file').prop("disabled", true);
        $('#dna_sequence').prop("disabled", true);
        $('#sg_file').val('');
        $('#sg_file_label').html('Load SnapGene file');
        $('#dna_sequence').val('');
        $('#dna_file').val('');
        $('#dna_file_label').html('Load DNA Fasta file');
    });

    $("#snapgene_option").click(function () {
        if($("#genbank_content").css("display")==='block'){
            $("#genbank_content").slideToggle("slow");
        }
        if($("#fasta_content").css("display")==='block') {
            $("#fasta_content").slideToggle("slow");
        }
        if($("#snapgene_content").css("display")==='none') {
            $("#snapgene_content").slideToggle("slow");
        }

        $('#sg_file').prop("disabled", false);
        $('#gb_file').prop("disabled", true);
        $('#dna_file').prop("disabled", true);
        $('#dna_sequence').prop("disabled", true);
        $('#gb_file').val('');
        $('#gb_file_label').html('Load GenBank file');
        $('#dna_sequence').val('');
        $('#dna_file').val('');
        $('#dna_file_label').html('Load DNA Fasta file');
    });

    $("#fasta_option").click(function () {
        if($("#genbank_content").css("display")==='block'){
            $("#genbank_content").slideToggle("slow");
        }
        if($("#snapgene_content").css("display")==='block') {
            $("#snapgene_content").slideToggle("slow");
        }
        if($("#fasta_content").css("display")==='none') {
            $("#fasta_content").slideToggle("slow");
        }

        $('#dna_file').prop("disabled", false);
        $('#dna_sequence').prop("disabled", false);
        $('#gb_file').prop("disabled", true);
        $('#sg_file').prop("disabled", true);
        $('#gb_file').val('');
        $('#gb_file_label').html('Load GenBank file');
        $('#sg_file').val('');
        $('#sg_file_label').html('Load SnapGene file');
    });

    $("#download_btn").click(function () {
        $("#spinner").slideToggle("slow")
    });


    $("#myCanvas1").attr({"width": $(".title").width()-300,
        "height": 30
    });
    var c1=document.getElementById("myCanvas1");
    var ctx1=c1.getContext("2d");
    ctx1.moveTo(0,15);
    ctx1.lineTo($(".title").width()-300,15);
    ctx1.stroke();


    $("#myCanvas2").attr({"width": $(".title").width()-300,
        "height": 30
    });
    var c2=document.getElementById("myCanvas2");
    var ctx2=c2.getContext("2d");
    ctx2.moveTo(0,15);
    ctx2.lineTo($(".title").width()-300,15);
    ctx2.stroke();


    $(window).resize(function () {

        $("#myCanvas1").attr({"width": $(".title").width()-300,
            "height": 30
        });
        var c1=document.getElementById("myCanvas1");
        var ctx1=c1.getContext("2d");
        ctx1.moveTo(0,15);
        ctx1.lineTo($(".title").width()-300,15);
        ctx1.stroke();


        $("#myCanvas2").attr({"width": $(".title").width()-300,
            "height": 30
        });
        var c2=document.getElementById("myCanvas2");
        var ctx2=c2.getContext("2d");
        ctx2.moveTo(0,15);
        ctx2.lineTo($(".title").width()-300,15);
        ctx2.stroke();
    });

    $("#gb_file").bind("change",function () {
        $('#gb_file_label').text(this.files[0]['name'])
    });

    $("#sg_file").bind("change",function () {
        $('#sg_file_label').text(this.files[0]['name'])
    });

    $("#dna_file").bind("change",function () {
        $('#dna_file_label').text(this.files[0]['name'])
    });

    $("#genbank_option").click(function () {

        $("#snapgene_option").css("color","#FFFFFF");
        $("#fasta_option").css("color","#FFFFFF");
        $("#genbank_option").css("color","#c3325f");

    });

    $("#snapgene_option").click(function () {

        $("#genbank_option").css("color","#FFFFFF");
        $("#fasta_option").css("color","#FFFFFF");
        $("#snapgene_option").css("color","#c3325f");

    });

    $("#fasta_option").click(function () {

        $("#genbank_option").css("color","#FFFFFF");
        $("#snapgene_option").css("color","#FFFFFF");
        $("#fasta_option").css("color","#c3325f");

    });

});


function read_dna_fa() {
    var inputfile = document.getElementById('dna_file');

    var file = inputfile.files[0];

    var reader = new FileReader();

    reader.readAsText(file,'utf8');
    reader.onload = function () {
        ipcRenderer.send('sent_dna_fa', this.result)
    };
}

function analyse() {

    form_info.pam = $('#PAM').val().toUpperCase();
    form_info.grna_length = Number($('#gRNA_length').val());
    form_info.Edit_window_start = Number($('#Edit_window_start').val());
    form_info.Edit_window_end = Number($('#Edit_window_end').val());
    form_info.dna_sequence = $('#dna_sequence').val().toUpperCase();
    if ($("#fasta_content").css("display")==='block'){
        form_info.FA = true
    }
    if ($('#dna_sequence').val() !== ''){form_info.DS = true}
    if ($('#dna_file').val() !== ''){form_info.DF = true}
    form_info.database = $('#offtarget').val();


    form_info['Cas protein'] = $("#Cas_protein").val()
    form_info['Edit window'] = form_info.Edit_window_start + '-' +form_info.Edit_window_end

    ipcRenderer.send('analyse', form_info);
}

ipcRenderer.on('gb_err', function () {
    alert("Oops... Please input right format file.");
});

function change_Cas_protein() {
    if ($('#Cas_protein').val() === 'spCas9(NGG)'){$('#PAM').val('NGG')}
    if ($('#Cas_protein').val() === 'AsCas12a(TTTN)'){$('#PAM').val('TTTN')}
    $('#gRNA_length').val('20')
}

// function download_offtarget_info(){
//     if($("#download_refresh").css("display")==='none') {
//         $("#download_refresh").slideToggle("slow");
//     }

//     let download = wget.download('https://sourceforge.net/projects/crispr-bets/files/' + $('#download').val(), './offtarget_info/'+$('#download').val());

//     download.on('error', function(err) {
//         console.log(err);
//     });

//     download.on('start', function(fileSize) {
//         console.log(fileSize);
//         if($("#download_finish").css("display")==='inline') {
//             $("#download_finish").slideToggle("slow");
//         }

//         if($("#download_check").css("display")==='inline-block') {
//             $("#download_check").slideToggle("slow");
//         }

//         $("#file_size").text('Download File Size:' + Math.ceil(fileSize/1000000) + 'Mb')
//     });

//     download.on('end', function(output) {
//         console.log(output);
//         if($("#download_refresh").css("display")==='inline-block') {
//             $("#download_refresh").slideToggle("slow");
//         }
//         $("#download_finish").slideToggle("slow");
//         $("#download_check").slideToggle("slow");

// //       下载介绍后在offtarget栏添加信息
//         fs.readdir('./offtarget_info/', function (err, files) {
//             if (err) {console.log('read file direction failed')}
//             else {
//                 if (files.indexOf($('#download').val() != -1)){
//                     $("#offtarget").append("<option value="+$('#download').val()+">"+offtarget_file_table($('#download').val())+"</option>")
//                 }
//             }
//         });

//     });

//     download.on('progress', function(progress) {

//         $("#download_progress").css("width", parseInt(progress*100) + "%").text(parseInt(progress*100) + "%");

//     });

//     if($("#download_info").css("display")==='none') {
//         $("#download_info").slideToggle("slow");
//     }

// }



// function offtarget_file_table(file_name){
//     file_table = {
//         "tigr7_20_NGG_ETScodon_gRNA_m3_offtarget.json":'Oryza sativa japonica(MSU7) NGG offtarget database',
//         "tigr7_20_NGA_ETScodon_gRNA_m3_offtarget.json":'Oryza sativa japonica(MSU7) NGA offtarget database',
//         "tigr7_20_NAAR_ETScodon_gRNA_m3_offtarget.json":'Oryza sativa japonica(MSU7) NAAR offtarget database',
//         "tigr7_20_NGGNG_ETScodon_gRNA_m3_offtarget.json":'Oryza sativa japonica(MSU7) NGGNG offtarget database',
//         "tigr7_20_NNAGAAW_ETScodon_gRNA_m3_offtarget.json":'Oryza sativa japonica(MSU7) NNAGAAW offtarget database',
//         "tigr7_20_NNNNGATT_ETScodon_gRNA_m3_offtarget.json":'Oryza sativa japonica(MSU7) NNNNGATT offtarget database',
//         "tigr7_20_YG_ETScodon_gRNA_m3_offtarget.json":'Oryza sativa japonica(MSU7) YG offtarget database',

//         "tair10_20_NGG_ETScodon_gRNA_m3_offtarget.json":'Arabidopsis thaliana(tair10) NGG offtarget database',
//         "tair10_20_NGA_ETScodon_gRNA_m3_offtarget.json":'Arabidopsis thaliana(tair10) NGA offtarget database',
//         "tair10_20_NAAR_ETScodon_gRNA_m3_offtarget.json":'Arabidopsis thaliana(tair10) NAAR offtarget database',
//         "tair10_20_NGGNG_ETScodon_gRNA_m3_offtarget.json":'Arabidopsis thaliana(tair10) NGGNG offtarget database',
//         "tair10_20_NNAGAAW_ETScodon_gRNA_m3_offtarget.json":'Arabidopsis thaliana(tair10) NNAGAAW offtarget database',
//         "tair10_20_NNG_ETScodon_gRNA_m3_offtarget.json":'Arabidopsis thaliana(tair10) NNG offtarget database',
//         "tair10_20_NNNNGATT_ETScodon_gRNA_m3_offtarget.json":'Arabidopsis thaliana(tair10) NNNNGATT offtarget database',
//         "tair10_20_NR_ETScodon_gRNA_m3_offtarget.json":'Arabidopsis thaliana(tair10) NR offtarget database',
//         "tair10_20_YG_ETScodon_gRNA_m3_offtarget.json":'Arabidopsis thaliana(tair10) YG offtarget database',
        
//         "RefGen_v4_20_NGG_ETScodon_gRNA_m3_offtarget.json":'Zea mays(RefGen_v4) NGG offtarget database',
//         "RefGen_v4_20_NGA_ETScodon_gRNA_m3_offtarget.json":'Zea mays(RefGen_v4) NGA offtarget database',
//         "RefGen_v4_20_NAAR_ETScodon_gRNA_m3_offtarget.json":'Zea mays(RefGen_v4) NAAR offtarget database',
//         "RefGen_v4_20_NGGNG_ETScodon_gRNA_m3_offtarget.json":'Zea mays(RefGen_v4) NGGNG offtarget database',
//         "RefGen_v4_20_NNAGAAW_ETScodon_gRNA_m3_offtarget.json":'Zea mays(RefGen_v4) NNAGAAW offtarget database',
//         "RefGen_v4_20_NNNNGATT_ETScodon_gRNA_m3_offtarget.json":'Zea mays(RefGen_v4) NNNNGATT offtarget database',
//     }

//     return file_table[file_name]
// }
