const electron = require('electron');
var remote = electron.remote;
const ipcRenderer = electron.ipcRenderer;
const fs = require('fs');

var form_info = {'dna_sequence': '', 'cas_protein':'spCas9(NGG)','pam': 'NGG', 'offtarget':'hg38','grna_length':20, 'DS':false}; //'DS': false, 'DF':false, 'FA':false};

$(document).ready(function(){

  window.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      m.popup({
          window: remote.getCurrentWindow()
      })
  }, false)

  ipcRenderer.send('get_app_path', '');

  ipcRenderer.on('send_app_path', function (event, data) {
      let app_path = data
  });
  ipcRenderer.on('gb_err', function () {
    alert("Oops... Please input right format file.");
  });

  //initialize variable
  $('#dna_file').prop(disabled, false);
  $('#dna_sequence').prop(disabled, false);

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

  $("#dna_file").bind("change",function () {
      $('#dna_file_label').text(this.files[0]['name'])
  });
});

function read_dna_fa() {
    var inputfile = document.getElementById('dna_file');
    var file = inputfile.files[0];
    var reader = new FileReader();

    reader.readAsText(file,'utf8');
    reader.onload = function () {
       ipcRenderer.send('sent_dna_fa', this.result)
    }
}

function analyse() {
  
  //alert("analyse function : dnasequence : " + $('#dna_sequence').val().toUpperCase());
  if($('#dna_sequence').val() == ''){
      form_info.DS = false;
  }else{
      form_info.dna_sequence = $('#dna_sequence').val().toUpperCase();
      form_info.DS = true;
  }

//   form_info.database = $('#offtarget').val();
//   form_info.cas_protein = $("#cas_protein").val()
//   form_info.grna_length = Number($('#grna_length').val());
  
  ipcRenderer.send('analyse', form_info);
}

function change_Cas_protein() {
  if ($('#cas_protein').val() === 'spCas9(NGG)'){
      //$('#PAM').val('NGG')
      form_info.pam = 'NGG';

  }else if($('#cas_protein').val() == 'AsCas12a(TTTN)'){
      form_info.pam = 'TTTN';
  }
}
