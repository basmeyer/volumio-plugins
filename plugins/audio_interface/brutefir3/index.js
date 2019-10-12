/*DRC-FIR plugin for volumio2. By balbuze 2019*/
'use strict';

var io = require('socket.io-client');
var fs = require('fs-extra');
var libFsExtra = require('fs-extra');
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;
var libQ = require('kew');
//var libNet = require('net');
var net = require('net');
var config = new(require('v-conf'))();
//var Telnet = require('telnet-client')
//var connection = new Telnet()
var socket = io.connect('http://localhost:3000');

var nchannels;


// Define the ControllerBrutefir class
module.exports = ControllerBrutefir;

function ControllerBrutefir(context) {
 var self = this;
 self.context = context;
 self.commandRouter = self.context.coreCommand;
 self.logger = self.commandRouter.logger;

 this.context = context;
 this.commandRouter = this.context.coreCommand;
 this.logger = this.context.logger;
 this.configManager = this.context.configManager;
 //self.brutefirDaemonConnect
};

ControllerBrutefir.prototype.onVolumioStart = function() {
 var self = this;
 var configFile = this.commandRouter.pluginManager.getConfigurationFile(this.context, 'config.json');
 this.commandRouter.sharedVars.registerCallback('alsa.outputdevice', this.outputDeviceCallback.bind(this));
 this.config = new(require('v-conf'))();
 this.config.loadFile(configFile);
 self.autoconfig

 return libQ.resolve();
};

ControllerBrutefir.prototype.getConfigurationFiles = function() {
 return ['config.json'];
};

// Plugin methods -----------------------------------------------------------------------------
//here we load snd_aloop module to provide a Loopback device
ControllerBrutefir.prototype.modprobeLoopBackDevice = function() {
 var self = this;
 var defer = libQ.defer();
 //self.hwinfo();
 exec("/usr/bin/sudo /sbin/modprobe snd_aloop index=7 pcm_substreams=2", {
  uid: 1000,
  gid: 1000
 }, function(error, stdout, stderr) {
  if (error) {
   self.logger.info('failed to load snd_aloop' + error);
  } else {
   self.commandRouter.pushConsoleMessage('snd_aloop loaded');
   defer.resolve();
  }
 });
 setTimeout(function() {

  return defer.promise;
 }, 500)
};

//here we detect hw info
ControllerBrutefir.prototype.hwinfo = function() {
 var self = this;
 //setTimeout(function() {
 var output_device = self.config.get('alsa_device');
 var nchannels;
 var formats;
 var hwinfo;
 exec('/data/plugins/audio_interface/brutefir/hw_params hw:' + output_device + ' >/data/configuration/audio_interface/brutefir/hwinfo.json ', {

  uid: 1000,
  gid: 1000
 }, function(error, stdout, stderr) {
  if (error) {
   self.logger.info('failedXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX ' + error);
  } else {

   fs.readFile('/data/configuration/audio_interface/brutefir/hwinfo.json', 'utf8', function(err, hwinfo) {
    if (err) {
     self.logger.info('Error reading hwinfo', err);
    } else {
     try {
      const hwinfoJSON = JSON.parse(hwinfo);
      nchannels = hwinfoJSON.channels.value;
      formats = hwinfoJSON.formats.value;

      self.logger.info('AAAAAAAAAAAAAAAAAAAAAAAAAA-> ' + nchannels + ' <-AAAAAAAAAAAAA');
      self.logger.info('AAAAAAAAAAAAAAAAAAAAAAAAAA-> ' + formats + ' <-AAAAAAAAAAAAA');
      self.config.set('nchannels', nchannels);
      self.config.set('formats', formats);
	var output_format = formats.split(" ").pop();
      self.logger.info('Auto set output format : ------->', output_format);
      self.config.set('output_format', output_format);
     } catch (e) {
      self.logger.info('Error reading hwinfo.json, detection failed', e);
      // nchannels = 2;
     }
    }
   });

  }
 })
}


//here we save the volumio config for the next plugin start
ControllerBrutefir.prototype.saveVolumioconfig = function() {
 var self = this;

 return new Promise(function(resolve, reject) {

  var cp = execSync('/bin/cp /data/configuration/audio_interface/alsa_controller/config.json /tmp/vconfig.json');
  var cp2 = execSync('/bin/cp /data/configuration/system_controller/i2s_dacs/config.json /tmp/i2sconfig.json');
  try {
   var cp3 = execSync('/bin/cp /boot/config.txt /tmp/config.txt');

  } catch (err) {
   self.logger.info('config.txt does not exist');
  }
  resolve();
 });
};

//here we define the volumio restore config
ControllerBrutefir.prototype.restoreVolumioconfig = function() {
 var self = this;
 return new Promise(function(resolve, reject) {
  setTimeout(function() {

   var cp = execSync('/bin/cp /tmp/vconfig.json /data/configuration/audio_interface/alsa_controller/config.json');
   var cp2 = execSync('/bin/cp /tmp/i2sconfig.json /data/configuration/system_controller/i2s_dacs/config.json');
   try {
    var cp3 = execSync('/bin/cp /tmp/config.txt /boot/config.txt');
   } catch (err) {
    self.logger.info('config.txt does not exist');
   }

  }, 8000)
  resolve();
 });
};


ControllerBrutefir.prototype.startBrutefirDaemon = function() {
 var self = this;

 var defer = libQ.defer();

 exec("/usr/bin/sudo /bin/systemctl start brutefir.service", {
  uid: 1000,
  gid: 1000
 }, function(error, stdout, stderr) {
  if (error) {
   self.logger.info('brutefir failed to start. Check your configuration ' + error);
  } else {
   self.commandRouter.pushConsoleMessage('Brutefir Daemon Started');
   defer.resolve();
  }
 });


};
/*
 //here we connect to brutefir to read peak errors
 ControllerBrutefir.prototype.brutefirDaemonConnect = function(defer) {
  var self = this;
var params = {
  host: '127.0.0.1',
  port: 3002,
 // shellPrompt: '/ # ',
  timeout: 1500,
  // removeEcho: 4
}
connection.connect(params)

connection.on('ready', function(prompt) {
  connection.exec(cmd, function(err, response) {
    console.log('brutefir connection' + response)
  })
})
/*
connection.on('timeout', function() {
  console.log('socket timeout!')
  connection.end()
})

connection.on('data', function() {
  console.log('from cli '+ data)
//  connection.end()
})
connection.on('close', function() {
  console.log('connection closed')
})

*/

/*  var client = new net.Socket();
  client.connect(3002, '127.0.0.1', function(err) {
   defer.resolve();
//setTimeout(function() {
   var brutefircmd

  brutefircmd = ('upk;lf');
   //here we send the command to brutefir
    
   client.write(brutefircmd);
//client.write('lf');
   console.log('cmd sent to brutefir = ' + brutefircmd);

  });
  //error handling section
  client.on('error', function(e) {

   if (e.code == 'ECONNREFUSED') {
    console.log('Huumm, is brutefir running ?');
    self.commandRouter.pushToastMessage('error', "Brutefir failed to start. Check your config !");

   }
  });

  //   setTimeout(function() {
  client.on('data', function(data) {
   console.log('Received from brutefir cli: ' + data);

 // client.destroy(); // kill client after server's response
  });
//}, 5000);

 };
*/

ControllerBrutefir.prototype.onStop = function() {
 var self = this;
 var defer = libQ.defer();
 self.logger.info("Stopping Brutefir service");
 self.commandRouter.stateMachine.stop().then(function() {
  exec("/usr/bin/sudo /bin/systemctl stop brutefir.service", {
   uid: 1000,
   gid: 1000
  }, function(error, stdout, stderr) {})

  self.restoresettingwhendisabling()
  socket.off()
 });
 //  socket.off = socket.removeListener;

 defer.resolve();
 return libQ.resolve();
 //return defer.promise;
};

ControllerBrutefir.prototype.autoconfig = function() {
 var self = this;
 var defer = libQ.defer();
 self.saveVolumioconfig()
  .then(self.hwinfo())
  .then(self.modprobeLoopBackDevice())
  .then(self.saveHardwareAudioParameters())
  .then(self.setLoopbackoutput())
  .then(self.rebuildBRUTEFIRAndRestartDaemon()) //no sure to keep it..
  .catch(function(err) {
   console.log(err);
  });
 defer.resolve()
 return defer.promise;

};


ControllerBrutefir.prototype.onStart = function() {
 var self = this;
 var defer = libQ.defer();

 socket.emit('getState', '');
 self.sendvolumelevel();

 self.autoconfig()
  .then(function(e) {
   setTimeout(function() {
    self.logger.info("Starting brutefir");
    //  self.rebuildBRUTEFIRAndRestartDaemon(defer);
    self.startBrutefirDaemon(defer);
   }, 1000);
   defer.resolve();
  })
  .fail(function(e) {
   defer.reject(new Error());
  });
 return defer.promise;
};

// here we switch roomEQ filters depending on volume level and send cmd to brutefir using its CLI
ControllerBrutefir.prototype.sendvolumelevel = function() {
 var self = this;



 socket.on('pushState', function(data) {
  var vobaf = self.config.get('vobaf');
  if (vobaf == true) {

   var brutefircmd
   var Lowsw = self.config.get('Lowsw');
   var LM1sw = self.config.get('LM1sw');
   var LM2sw = self.config.get('LM2sw');
   var LM3sw = self.config.get('LM3sw');
   var HMsw = self.config.get('HMsw');
   var Highsw = self.config.get('Highsw');
   var Low = self.config.get('Low');
   var LM1 = self.config.get('LM1');
   var LM2 = self.config.get('LM2');
   var LM3 = self.config.get('LM3');
   var M = self.config.get('M');
   var HM = self.config.get('HM');
   var filmess;
   var lVoBAF, rVoBAF;

   //1-all filters enabled
   if (Lowsw == true && LM1sw == true && LM2sw == true && LM3sw == true && HMsw == true && Highsw == true) {
    if (data.volume < Low) {
     filmess = "Low"
     lVoBAF = "lLow"
     rVoBAF = "rLow"

    } else if (data.volume >= Low && data.volume < LM1) {
     filmess = "LM1"
     lVoBAF = "lLM1"
     rVoBAF = "rLM1"

    } else if (data.volume >= LM1 && data.volume < LM2) {
     filmess = "LM2"
     lVoBAF = "lLM2"
     rVoBAF = "rLM2"

    } else if (data.volume >= LM2 && data.volume < LM3) {
     filmess = "LM3"
     lVoBAF = "lLM3"
     rVoBAF = "rLM3"

    } else if (data.volume >= LM3 && data.volume < M) {
     filmess = "M"
     lVoBAF = "lM"
     rVoBAF = "rM"

    } else if (data.volume >= M && data.volume < HM) {
     filmess = "HM"
     lVoBAF = "lHM"
     rVoBAF = "rHM"

    } else if (data.volume >= HM) {
     filmess = "High"
     lVoBAF = "lHigh"
     rVoBAF = "rHigh"
    }
   }
   //2-Low not enabled
   if (Lowsw == false && LM1sw == true && LM2sw == true && LM3sw == true && HMsw == true && Highsw == true) {
    if (data.volume < LM1) {
     filmess = "LM1"
     lVoBAF = "lLM1"
     rVoBAF = "rLM1"

    } else if (data.volume >= LM1 && data.volume < LM2) {
     filmess = "LM2"
     lVoBAF = "lLM2"
     rVoBAF = "rLM2"

    } else if (data.volume >= LM2 && data.volume < LM3) {
     filmess = "LM3"
     lVoBAF = "lLM3"
     rVoBAF = "rLM3"

    } else if (data.volume >= LM3 && data.volume < M) {
     filmess = "M"
     lVoBAF = "lM"
     rVoBAF = "rM"

    } else if (data.volume >= M && data.volume < HM) {
     filmess = "HM"
     lVoBAF = "lHM"
     rVoBAF = "rHM"

    } else if (data.volume >= HM) {
     filmess = "High"
     lVoBAF = "lHigh"
     rVoBAF = "rHigh"
    }
   }
   //3-lOW,LM1 not enabled
   if (Lowsw == false && LM1sw == false && LM2sw == true && LM3sw == true && HMsw == true && Highsw == true) {
    if (data.volume < LM2) {
     filmess = "LM2"
     lVoBAF = "lLM2"
     rVoBAF = "rLM2"

    } else if (data.volume >= LM2 && data.volume < LM3) {
     filmess = "LM3"
     lVoBAF = "lLM3"
     rVoBAF = "rLM3"

    } else if (data.volume >= LM3 && data.volume < M) {
     filmess = "M"
     lVoBAF = "lM"
     rVoBAF = "rM"

    } else if (data.volume >= M && data.volume < HM) {
     filmess = "HM"
     lVoBAF = "lHM"
     rVoBAF = "rHM"

    } else if (data.volume >= HM) {
     filmess = "High"
     lVoBAF = "lHigh"
     rVoBAF = "rHigh"
    }
   }
   //4-lOW, LM1,LM2 not enabled
   if (Lowsw == false && LM1sw == false && LM2sw == false && LM3sw == true && HMsw == true && Highsw == true) {
    if (data.volume < LM3) {
     filmess = "LM3"
     lVoBAF = "lLM3"
     rVoBAF = "rLM3"

    } else if (data.volume >= LM3 && data.volume < M) {
     filmess = "M"
     lVoBAF = "lM"
     rVoBAF = "rM"

    } else if (data.volume >= M && data.volume < HM) {
     filmess = "HM"
     lVoBAF = "lHM"
     rVoBAF = "rHM"

    } else if (data.volume >= HM) {
     filmess = "High"
     lVoBAF = "lHigh"
     rVoBAF = "rHigh"
    }
   }
   //5-High not enabled
   if (Lowsw == true && LM1sw == true && LM2sw == true && LM3sw == true && HMsw == true && Highsw == false) {
    if (data.volume < Low) {
     filmess = "Low"
     lVoBAF = "lLow"
     rVoBAF = "rLow"

    } else if (data.volume >= Low && data.volume < LM1) {
     filmess = "LM1"
     lVoBAF = "lLM1"
     rVoBAF = "rLM1"

    } else if (data.volume >= LM1 && data.volume < LM2) {
     filmess = "LM2"
     lVoBAF = "lLM2"
     rVoBAF = "rLM2"

    } else if (data.volume >= LM2 && data.volume < LM3) {
     filmess = "LM3"
     lVoBAF = "lLM3"
     rVoBAF = "rLM3"

    } else if (data.volume >= LM3 && data.volume < M) {
     filmess = "M"
     lVoBAF = "lM"
     rVoBAF = "rM"

    } else if (data.volume >= M) {
     filmess = "HM"
     lVoBAF = "lHM"
     rVoBAF = "rHM"
    }
   }

   //6-HM and High not enabled
   if (Lowsw == true && LM1sw == true && LM2sw == true && LM3sw == true && HMsw == false && Highsw == false) {
    if (data.volume < Low) {
     filmess = "Low"
     lVoBAF = "lLow"
     rVoBAF = "rLow"

    } else if (data.volume >= Low && data.volume < LM1) {
     filmess = "LM1"
     lVoBAF = "lLM1"
     rVoBAF = "rLM1"

    } else if (data.volume >= LM1 && data.volume < LM2) {
     filmess = "LM2"
     lVoBAF = "lLM2"
     rVoBAF = "rLM2"

    } else if (data.volume >= LM2 && data.volume < LM3) {
     filmess = "LM3"
     lVoBAF = "lLM3"
     rVoBAF = "rLM3"

    } else if (data.volume >= LM3) {
     filmess = "M"
     lVoBAF = "lM"
     rVoBAF = "rM"
    }
   }

   //7-Low, HM and High not enabled
   if (Lowsw == false && LM1sw == true && LM2sw == true && LM3sw == true && HMsw == false && Highsw == false) {
    if (data.volume < LM1) {
     filmess = "LM1"
     lVoBAF = "lLM1"
     rVoBAF = "rLM1"

    } else if (data.volume >= LM1 && data.volume < LM2) {
     filmess = "LM2"
     lVoBAF = "lLM2"
     rVoBAF = "rLM2"

    } else if (data.volume >= LM2 && data.volume < LM3) {
     filmess = "LM3"
     lVoBAF = "lLM3"
     rVoBAF = "rLM3"

    } else if (data.volume >= LM3) {
     filmess = "M"
     lVoBAF = "lM"
     rVoBAF = "rM"
    }
   }

   //8-Low, LM1, HM and High not enabled
   if (Lowsw == false && LM1sw == false && LM2sw == true && LM3sw == true && HMsw == false && Highsw == false) {
    if (data.volume < LM2) {
     filmess = "LM2"
     lVoBAF = "lLM2"
     rVoBAF = "rLM2"

    } else if (data.volume >= LM2 && data.volume < LM3) {
     filmess = "LM3"
     lVoBAF = "lLM3"
     rVoBAF = "rLM3"

    } else if (data.volume >= LM3) {
     filmess = "M"
     lVoBAF = "lM"
     rVoBAF = "rM"
    }
   }

   //9-Low, LM1, LM2, LM3 and High not enabled
   if (Lowsw == false && LM1sw == false && LM2sw == false && LM3sw == false && HMsw == true && Highsw == false) {
    if (data.volume < M) {
     filmess = "M"
     lVoBAF = "lM"
     rVoBAF = "rM"

    } else if (data.volume >= M) {
     filmess = "HM"
     lVoBAF = "lHM"
     rVoBAF = "rHM"
    }
   }

   //10-Low and High not enabled
   if (Lowsw == false && LM1sw == true && LM2sw == true && LM3sw == true && HMsw == true && Highsw == false) {
    if (data.volume < LM1) {
     filmess = "LM1"
     lVoBAF = "lLM1"
     rVoBAF = "rLM1"

    } else if (data.volume >= LM1 && data.volume < LM2) {
     filmess = "LM2"
     lVoBAF = "lLM2"
     rVoBAF = "rLM2"

    } else if (data.volume >= LM2 && data.volume < LM3) {
     filmess = "LM3"
     lVoBAF = "lLM3"
     rVoBAF = "rLM3"

    } else if (data.volume >= LM3 && data.volume < M) {
     filmess = "M"
     lVoBAF = "lM"
     rVoBAF = "rM"

    } else if (data.volume >= M) {
     filmess = "HM"
     lVoBAF = "lHM"
     rVoBAF = "rHM"
    }
   }

   //11- Low, LM1 and High not enabled
   if (Lowsw == false && LM1sw == false && LM2sw == true && LM3sw == true && HMsw == true && Highsw == false) {
    if (data.volume < LM2) {
     filmess = "LM2"
     lVoBAF = "lLM2"
     rVoBAF = "rLM2"

    } else if (data.volume >= LM2 && data.volume < LM3) {
     filmess = "LM3"
     lVoBAF = "lLM3"
     rVoBAF = "rLM3"

    } else if (data.volume >= LM3 && data.volume < M) {
     filmess = "M"
     lVoBAF = "lM"
     rVoBAF = "rM"

    } else if (data.volume >= M) {
     filmess = "HM"
     lVoBAF = "lHM"
     rVoBAF = "rHM"
    }
   }

   //12- Low, LM1, LM2, LM3, HM and High not enabled
   if (Lowsw == false && LM1sw == false && LM2sw == false && LM3sw == false && HMsw == false && Highsw == false) {
    filmess = "M"
    lVoBAF = "lM"
    rVoBAF = "rM"

   }

   //13-Low, LM1, LM2, HM and High not enabled
   if (Lowsw == false && LM1sw == false && LM2sw == false && LM3sw == true && HMsw == false && Highsw == false) {
    if (data.volume < LM3) {
     filmess = "LM3"
     lVoBAF = "lLM3"
     rVoBAF = "rLM3"

    } else if (data.volume >= LM3) {
     filmess = "M"
     lVoBAF = "lM"
     rVoBAF = "rM"
    }
   }

   //14-Low, LM1, LM2 and LM3 not enabled
   if (Lowsw == false && LM1sw == false && LM2sw == false && LM3sw == false && HMsw == true && Highsw == true) {
    if (data.volume < M) {
     filmess = "M"
     lVoBAF = "lM"
     rVoBAF = "rM"

    } else if (data.volume >= M && data.volume < HM) {
     filmess = "HM"
     lVoBAF = "lHM"
     rVoBAF = "rHM"

    } else if (data.volume >= HM) {
     filmess = "High"
     lVoBAF = "lHigh"
     rVoBAF = "rHigh"
    }
   }

   //  here wend cmd to brutefir


   brutefircmd = ('cfc "lVoBAF" "' + lVoBAF + '" ;cfc "rVoBAF" "' + rVoBAF + '"');

   if (self.config.get('messon') == true) {
    setTimeout(function() {
     self.commandRouter.pushToastMessage('info', "VoBAF filter used :" + filmess);
    }, 500);
   };
   var client = new net.Socket();
   client.connect(3002, '127.0.0.1', function(err) {
    client.write(brutefircmd);
    console.log('cmd sent to brutefir = ' + brutefircmd);
   });

   //error handling section
   client.on('error', function(e) {
    if (e.code == 'ECONNREFUSED') {
     console.log('Huumm, is brutefir running ?');
     self.commandRouter.pushToastMessage('error', "Brutefir failed to start. Check your config !");
    }
   });
   client.on('data', function(data) {
    console.log('Received: ' + data);
    client.destroy(); // kill client after server's response
   });
  };
 });
};

ControllerBrutefir.prototype.onRestart = function() {
 var self = this;

};

ControllerBrutefir.prototype.onInstall = function() {
 var self = this;

 //	//Perform your installation tasks here
};

ControllerBrutefir.prototype.onUninstall = function() {
 var self = this;
 //Perform your installation tasks here
};

ControllerBrutefir.prototype.getUIConfig = function() {
 var self = this;
 var defer = libQ.defer();
 var output_device;
 output_device = self.config.get('output_device');

 var lang_code = this.commandRouter.sharedVars.get('language_code');
 self.commandRouter.i18nJson(__dirname + '/i18n/strings_' + lang_code + '.json',
   __dirname + '/i18n/strings_en.json',
   __dirname + '/UIConfig.json')

  .then(function(uiconf)

   {
    var value;
    var valuestoredl, valuestoredls;
    var valuestoredr, valuestoredrs;
    var valuestoredf;
    var filterfolder = "/data/INTERNAL/brutefirfilters";
    var filtersources = "/data/INTERNAL/brutefirfilters/filter-sources";
    var items;
    var allfilter;
    var oformat;
    var filetoconvertl;
    var bkpath = "/data/INTERNAL/brutefirfilters/target-curves";
    var tc


    //-----Room settings section
    uiconf.sections[2].hidden = true;
    uiconf.sections[2].content[0].value = self.config.get('ldistance');
    uiconf.sections[2].content[1].value = self.config.get('rdistance');

    // ------


    uiconf.sections[3].content[3].value = self.config.get('outputfilename');
    //   uiconf.sections[3].content[1].value = self.config.get('rewversion');

    //-----------------------------------
    // here we list the content of the folder to populate filter scrolling list
   // value = self.config.get('attenuation');
   // self.configManager.setUIConfigParam(uiconf, 'sections[0].content[0].value.value', value);
   // self.configManager.setUIConfigParam(uiconf, 'sections[0].content[0].value.label', self.getLabelForSelect(self.configManager.getValue(uiconf, 'sections[0].content[0].options'), value));


    valuestoredl = self.config.get('leftfilter');
    self.configManager.setUIConfigParam(uiconf, 'sections[0].content[0].value.value', valuestoredl);
    self.configManager.setUIConfigParam(uiconf, 'sections[0].content[0].value.label', valuestoredl);

    uiconf.sections[0].content[1].value = self.config.get('lc1delay');

    valuestoredr = self.config.get('rightfilter');
    self.configManager.setUIConfigParam(uiconf, 'sections[0].content[2].value.value', valuestoredr);
    self.configManager.setUIConfigParam(uiconf, 'sections[0].content[2].value.label', valuestoredr);

    uiconf.sections[0].content[3].value = self.config.get('rc1delay');

    value = self.config.get('attenuation');
    self.configManager.setUIConfigParam(uiconf, 'sections[0].content[4].value.value', value);
    self.configManager.setUIConfigParam(uiconf, 'sections[0].content[4].value.label', value);


    var nchannelssection = self.config.get('nchannels');
    self.logger.info('Number of channels detected : ----------->' + nchannelssection);
    if (nchannelssection == '2') {
     uiconf.sections[0].content[5].hidden = true;

    } else {
     uiconf.sections[0].content[5].hidden = false;
    }
    if (nchannelssection == '2') { //&& (addchannels == true)) {
     uiconf.sections[0].content[6].hidden = true;
     uiconf.sections[0].content[7].hidden = true;
     uiconf.sections[0].content[8].hidden = true;
     uiconf.sections[0].content[9].hidden = true;
     uiconf.sections[0].content[10].hidden = true;
     uiconf.sections[0].content[11].hidden = true;
     uiconf.sections[0].content[12].hidden = true;
     uiconf.sections[0].content[13].hidden = true;
     uiconf.sections[0].content[14].hidden = true;
     uiconf.sections[0].content[15].hidden = true;
     uiconf.sections[0].content[16].hidden = true;
     uiconf.sections[0].content[17].hidden = true;
     uiconf.sections[0].content[18].hidden = true;
     uiconf.sections[0].content[19].hidden = true;
     uiconf.sections[0].content[20].hidden = true;
    }
/*
    if (nchannelssection == '3') { //&& (addchannels == true)) {
     uiconf.sections[0].content[8].hidden = true;
     uiconf.sections[0].content[9].hidden = true;
     uiconf.sections[0].content[10].hidden = true;
     uiconf.sections[0].content[11].hidden = true;
     uiconf.sections[0].content[12].hidden = true;
     uiconf.sections[0].content[13].hidden = true;
     uiconf.sections[0].content[14].hidden = true;
     uiconf.sections[0].content[15].hidden = true;
     uiconf.sections[0].content[16].hidden = true;
     uiconf.sections[0].content[17].hidden = true;
     uiconf.sections[0].content[18].hidden = true;
     uiconf.sections[0].content[19].hidden = true;
     uiconf.sections[0].content[20].hidden = true;
    }
*/
    if (nchannelssection == '4') { //&& (addchannels == true)) {
     uiconf.sections[0].content[10].hidden = false;
     uiconf.sections[0].content[11].hidden = true;
     uiconf.sections[0].content[12].hidden = true;
     uiconf.sections[0].content[13].hidden = true;
     uiconf.sections[0].content[14].hidden = true;
     uiconf.sections[0].content[15].hidden = true;
     uiconf.sections[0].content[16].hidden = true;
     uiconf.sections[0].content[17].hidden = true;
     uiconf.sections[0].content[18].hidden = true;
     uiconf.sections[0].content[19].hidden = true;
     uiconf.sections[0].content[20].hidden = true;
    }
/*
    if (nchannelssection == '5') { //&& (addchannels == true)) {
     uiconf.sections[0].content[12].hidden = true;
     uiconf.sections[0].content[13].hidden = true;
     uiconf.sections[0].content[14].hidden = true;
     uiconf.sections[0].content[15].hidden = true;
     uiconf.sections[0].content[16].hidden = true;
     uiconf.sections[0].content[17].hidden = true;
     uiconf.sections[0].content[18].hidden = true;
     uiconf.sections[0].content[19].hidden = true;
     uiconf.sections[0].content[20].hidden = true;
    }
*/
    if (nchannelssection == '6') { //&& (addchannels == true)) {
     uiconf.sections[0].content[10].hidden = false;
     uiconf.sections[0].content[11].hidden = false;
     uiconf.sections[0].content[12].hidden = false;
     uiconf.sections[0].content[13].hidden = false;
     uiconf.sections[0].content[14].hidden = false;
     uiconf.sections[0].content[15].hidden = false;
     uiconf.sections[0].content[16].hidden = true;
     uiconf.sections[0].content[17].hidden = true;
     uiconf.sections[0].content[18].hidden = true;
     uiconf.sections[0].content[19].hidden = true;
     uiconf.sections[0].content[20].hidden = true;
    }
/*
    if (nchannelssection == '7') { //&& (addchannels == true)) {
     uiconf.sections[0].content[16].hidden = false;
     uiconf.sections[0].content[17].hidden = true;
     uiconf.sections[0].content[18].hidden = true;
     uiconf.sections[0].content[19].hidden = true;
     uiconf.sections[0].content[20].hidden = true;
    }
*/
    if (nchannelssection == '8') { //&& (addchannels == true)) {
     uiconf.sections[0].content[10].hidden = false;
     uiconf.sections[0].content[11].hidden = false;
     uiconf.sections[0].content[12].hidden = false;
     uiconf.sections[0].content[13].hidden = false;
     uiconf.sections[0].content[14].hidden = false;
     uiconf.sections[0].content[15].hidden = false;
     uiconf.sections[0].content[16].hidden = false;
     uiconf.sections[0].content[17].hidden = false;
     uiconf.sections[0].content[18].hidden = false;
     uiconf.sections[0].content[19].hidden = false;
     uiconf.sections[0].content[20].hidden = false;
    }



    uiconf.sections[0].content[5].value = self.config.get('addchannels');

    valuestoredls = self.config.get('leftc2filter');
    self.configManager.setUIConfigParam(uiconf, 'sections[0].content[6].value.value', valuestoredls);
    self.configManager.setUIConfigParam(uiconf, 'sections[0].content[6].value.label', valuestoredls);

    uiconf.sections[0].content[7].value = self.config.get('lc2delay');

    valuestoredrs = self.config.get('rightc2filter');
    self.configManager.setUIConfigParam(uiconf, 'sections[0].content[8].value.value', valuestoredrs);
    self.configManager.setUIConfigParam(uiconf, 'sections[0].content[8].value.label', valuestoredrs);

    uiconf.sections[0].content[9].value = self.config.get('rc2delay');
					
 	var attenuationlr2 = self.config.get('attenuationlr2');
    self.configManager.setUIConfigParam(uiconf, 'sections[0].content[10].value.value', attenuationlr2);
    self.configManager.setUIConfigParam(uiconf, 'sections[0].content[10].value.label', attenuationlr2);

       valuestoredls = self.config.get('leftc3filter');
    self.configManager.setUIConfigParam(uiconf, 'sections[0].content[11].value.value', valuestoredls);
    self.configManager.setUIConfigParam(uiconf, 'sections[0].content[11].value.label', valuestoredls);

    uiconf.sections[0].content[12].value = self.config.get('lc3delay');

    valuestoredrs = self.config.get('rightc3filter');
    self.configManager.setUIConfigParam(uiconf, 'sections[0].content[13].value.value', valuestoredrs);
    self.configManager.setUIConfigParam(uiconf, 'sections[0].content[13].value.label', valuestoredrs);

    uiconf.sections[0].content[14].value = self.config.get('rc3delay');

var attenuationlr3 = self.config.get('attenuationlr3');
    self.configManager.setUIConfigParam(uiconf, 'sections[0].content[15].value.value', attenuationlr3);
    self.configManager.setUIConfigParam(uiconf, 'sections[0].content[15].value.label', attenuationlr3);


    valuestoredls = self.config.get('leftc4filter');
    self.configManager.setUIConfigParam(uiconf, 'sections[0].content[16].value.value', valuestoredls);
    self.configManager.setUIConfigParam(uiconf, 'sections[0].content[16].value.label', valuestoredls);

    uiconf.sections[0].content[17].value = self.config.get('lc4delay');


    valuestoredrs = self.config.get('rightc4filter');
    self.configManager.setUIConfigParam(uiconf, 'sections[0].content[18].value.value', valuestoredrs);
    self.configManager.setUIConfigParam(uiconf, 'sections[0].content[18].value.label', valuestoredrs);

    uiconf.sections[0].content[19].value = self.config.get('rc4delay');

var attenuationlr4 = self.config.get('attenuationlr4');
    self.configManager.setUIConfigParam(uiconf, 'sections[0].content[20].value.value', attenuationlr4);
    self.configManager.setUIConfigParam(uiconf, 'sections[0].content[20].value.label', attenuationlr4);


 	for (let n = 0; n < 22; n++) {
     self.configManager.pushUIConfigParam(uiconf, 'sections[0].content[4].options', {
      value: (n),
      label: (n)
     });
	self.configManager.pushUIConfigParam(uiconf, 'sections[0].content[10].options', {
      value: (n),
      label: (n)
     });
	 self.configManager.pushUIConfigParam(uiconf, 'sections[0].content[15].options', {
      value: (n),
      label: (n)
     });
 	self.configManager.pushUIConfigParam(uiconf, 'sections[0].content[20].options', {
      value: (n),
      label: (n)
     });
 
    }

    fs.readdir(filterfolder, function(err, item) {
     allfilter = 'Dirac pulse,' + 'None,' + item;
     var allfilters = allfilter.replace('filter-sources', '');
     var allfilter2 = allfilters.replace('target-curves', '');
     var allfilter3 = allfilter2.replace('VoBAFfilters', '').replace(',,', ',').replace(',,',',');
     var items = allfilter3.split(',');
     items.pop();
     self.logger.info('list of available filters for DRC :' + items);
     for (var i in items) {
      self.configManager.pushUIConfigParam(uiconf, 'sections[0].content[0].options', {
       value: items[i],
       label: items[i]
      });
      self.configManager.pushUIConfigParam(uiconf, 'sections[0].content[2].options', {
       value: items[i],
       label: items[i]
      });
      self.configManager.pushUIConfigParam(uiconf, 'sections[0].content[6].options', {
       value: items[i],
       label: items[i]
      });
      self.configManager.pushUIConfigParam(uiconf, 'sections[0].content[8].options', {
       value: items[i],
       label: items[i]
      });
      self.configManager.pushUIConfigParam(uiconf, 'sections[0].content[11].options', {
       value: items[i],
       label: items[i]
      });
      self.configManager.pushUIConfigParam(uiconf, 'sections[0].content[13].options', {
       value: items[i],
       label: items[i]
      });
      self.configManager.pushUIConfigParam(uiconf, 'sections[0].content[16].options', {
       value: items[i],
       label: items[i]
      });
      self.configManager.pushUIConfigParam(uiconf, 'sections[0].content[18].options', {
       value: items[i],
       label: items[i]
      });

      self.logger.info('list of available filters UI :' + items[i]);
     }

    });


    value = self.config.get('filter_format');
    self.configManager.setUIConfigParam(uiconf, 'sections[0].content[21].value.value', value);
    self.configManager.setUIConfigParam(uiconf, 'sections[0].content[21].value.label', self.getLabelForSelect(self.configManager.getValue(uiconf, 'sections[0].content[21].options'), value));

    value = self.config.get('filter_size');
    self.configManager.setUIConfigParam(uiconf, 'sections[0].content[22].value.value', value);
    self.configManager.setUIConfigParam(uiconf, 'sections[0].content[22].value.label', self.getLabelForSelect(self.configManager.getValue(uiconf, 'sections[0].content[22].options'), value));

    value = self.config.get('smpl_rate');
    self.configManager.setUIConfigParam(uiconf, 'sections[0].content[23].value.value', value);
    self.configManager.setUIConfigParam(uiconf, 'sections[0].content[23].value.label', self.getLabelForSelect(self.configManager.getValue(uiconf, 'sections[0].content[23].options'), value));

    //-------------------------------------------------
    //here we read the content of the file sortsamplec.txt (it will be generated by a script to detect hw capabilities).


    valuestoredf = self.config.get('output_format');
    self.configManager.setUIConfigParam(uiconf, 'sections[0].content[24].value.value', valuestoredf);
    self.configManager.setUIConfigParam(uiconf, 'sections[0].content[24].value.label', valuestoredf);


    //  var filetoread = "/data/configuration/audio_interface/brutefir/sortsample.txt";
    try {
     //  var sampleformat = fs.readFileSync(filetoread, 'utf8').toString().split('\n');
     var sampleformat = self.config.get("formats").split(' ');
     var sampleformatf = (', Factory_S16_LE, Factory_S24_LE, Factory_S24_3LE, Factory_S24_4LE, Factory_S32_LE, ')
     var sampleformato
     var sitems
     var js
     if (sampleformat == "") {
      sampleformato = sampleformatf;
     } else {

      var str22 = sampleformat.toString().replace(/S/g, "HW-Detected-S");
      var str2 = str22.toString().replace(/\s/g, '');
      var str21 = str2.substring(0, str2.length - 1);
      js = str21
     }
     if (str2 == null) {
      str2 = "Detection\ fails.\ Reboot\ to\ retry, "
     }
     var result = str2 + sampleformatf

     self.logger.info('result formats ' + result);
     var str1 = result.replace(/\s/g, '');
     var str = str1.substring(0, str1.length - 1);

     sitems = str.split(',');
     sitems.shift();
     for (var i in sitems) {
      self.logger.info('list of available output formatUI :' + sitems[i]);
      self.configManager.pushUIConfigParam(uiconf, 'sections[0].content[24].options', {
       value: sitems[i],
       label: sitems[i]
      });
     }
    } catch (e) {
     self.logger.error('Could not read file: ' + e)
     console.log(sampleformat)

    }



    filetoconvertl = self.config.get('filetoconvert');
    self.configManager.setUIConfigParam(uiconf, 'sections[3].content[0].value.value', filetoconvertl);
    self.configManager.setUIConfigParam(uiconf, 'sections[3].content[0].value.label', filetoconvertl);



    fs.readdir(filtersources, function(err, fitem) {
     var fitems;
     var filetoconvert = '' + fitem;
     fitems = filetoconvert.split(',');
     self.logger.info('list of available files to convert :' + fitems);
     console.log(fitems)
     for (var i in fitems) {
      self.configManager.pushUIConfigParam(uiconf, 'sections[3].content[0].options', {
       value: fitems[i],
       label: fitems[i]
      });
     }
    });

    tc = self.config.get('tc');
    self.configManager.setUIConfigParam(uiconf, 'sections[3].content[1].value.value', tc);
    self.configManager.setUIConfigParam(uiconf, 'sections[3].content[1].value.label', tc);


    fs.readdir(bkpath, function(err, bitem) {
     var bitems;
     var filetoconvert = '' + bitem;
     bitems = filetoconvert.split(',');
     self.logger.info('list of available curves :' + bitems);
     console.log(bitems)
     for (var i in bitems) {
      self.configManager.pushUIConfigParam(uiconf, 'sections[3].content[1].options', {
       value: bitems[i],
       label: bitems[i]
      });
     }
    });

    value = self.config.get('drcconfig');
    self.configManager.setUIConfigParam(uiconf, 'sections[3].content[2].value.value', value);
    self.configManager.setUIConfigParam(uiconf, 'sections[3].content[2].value.label', self.getLabelForSelect(self.configManager.getValue(uiconf, 'sections[3].content[2].options'), value));




    var value


    //--------VoBAF section----------------------------------------------------------


    uiconf.sections[1].content[0].value = self.config.get('vobaf');

    uiconf.sections[1].content[2].value = self.config.get('Lowsw');
    var Low = self.config.get('Low');
    self.configManager.setUIConfigParam(uiconf, 'sections[1].content[3].value.value', Low);
    self.configManager.setUIConfigParam(uiconf, 'sections[1].content[3].value.label', Low);

    for (let i = 0; i < 50; i++) {

     //   self.logger.info('list of low values :' + (i));
     self.configManager.pushUIConfigParam(uiconf, 'sections[1].content[3].options', {
      value: (i),
      label: (i)
     });
    }
    uiconf.sections[1].content[4].value = self.config.get('LM1sw');
    var LM1 = self.config.get('LM1');
    self.configManager.setUIConfigParam(uiconf, 'sections[1].content[5].value.value', LM1);
    self.configManager.setUIConfigParam(uiconf, 'sections[1].content[5].value.label', LM1);

    for (let j = 0; j < 70; j++) {

     //   self.logger.info('list of LM1 values :' + (j));
     self.configManager.pushUIConfigParam(uiconf, 'sections[1].content[5].options', {
      value: (j),
      label: (j)
     });
    }
    uiconf.sections[1].content[6].value = self.config.get('LM2sw');
    var LM2 = self.config.get('LM2');
    self.configManager.setUIConfigParam(uiconf, 'sections[1].content[7].value.value', LM2);
    self.configManager.setUIConfigParam(uiconf, 'sections[1].content[7].value.label', LM2);

    for (let k = 0; k < 80; k++) {

     //  self.logger.info('list of LM2 values :' + (k));
     self.configManager.pushUIConfigParam(uiconf, 'sections[1].content[7].options', {
      value: (k),
      label: (k)
     });
    }

    uiconf.sections[1].content[8].value = self.config.get('LM3sw');
    var LM3 = self.config.get('LM3');
    self.configManager.setUIConfigParam(uiconf, 'sections[1].content[9].value.value', LM3);
    self.configManager.setUIConfigParam(uiconf, 'sections[1].content[9].value.label', LM3);

    for (let o = 0; o < 85; o++) {

     //  self.logger.info('list of LM3 values :' + (0));
     self.configManager.pushUIConfigParam(uiconf, 'sections[1].content[9].options', {
      value: (o),
      label: (o)
     });
    }

    var M = self.config.get('M');
    self.configManager.setUIConfigParam(uiconf, 'sections[1].content[11].value.value', M);
    self.configManager.setUIConfigParam(uiconf, 'sections[1].content[11].value.label', M);

    for (let l = 0; l < 100; l++) {

     //   self.logger.info('list of M values :' + (l));
     self.configManager.pushUIConfigParam(uiconf, 'sections[1].content[11].options', {
      value: (l),
      label: (l)
     });
    }
    uiconf.sections[1].content[12].value = self.config.get('HMsw');
    var HM = self.config.get('HM');
    self.configManager.setUIConfigParam(uiconf, 'sections[1].content[13].value.value', HM);
    self.configManager.setUIConfigParam(uiconf, 'sections[1].content[13].value.label', HM);

    for (let m = 30; m < 100; m++) {

     //  self.logger.info('list of HM values :' + (m));
     self.configManager.pushUIConfigParam(uiconf, 'sections[1].content[13].options', {
      value: (m),
      label: (m)
     });
    }
    uiconf.sections[1].content[14].value = self.config.get('Highsw');

    var vatt = self.config.get('vatt');
    self.configManager.setUIConfigParam(uiconf, 'sections[1].content[16].value.value', vatt);
    self.configManager.setUIConfigParam(uiconf, 'sections[1].content[16].value.label', vatt);

    for (let n = 0; n < 30; n++) {

     //  self.logger.info('list of HM values :' + (n));
     self.configManager.pushUIConfigParam(uiconf, 'sections[1].content[16].options', {
      value: (n),
      label: (n)
     });
    }


    value = self.config.get('vobaf_format');
    self.configManager.setUIConfigParam(uiconf, 'sections[1].content[17].value.value', value);
    self.configManager.setUIConfigParam(uiconf, 'sections[1].content[17].value.label', self.getLabelForSelect(self.configManager.getValue(uiconf, 'sections[1].content[17].options'), value));


    uiconf.sections[1].content[18].value = self.config.get('messon');
    //    uiconf.sections[0].content[8].value = self.config.get('vrange');




    defer.resolve(uiconf);
   })
  .fail(function() {
   defer.reject(new Error());
  })
 return defer.promise

};

ControllerBrutefir.prototype.getLabelForSelect = function(options, key) {
 var n = options.length;
 for (var i = 0; i < n; i++) {
  if (options[i].value == key)
   return options[i].label;
 }

 return 'VALUE NOT FOUND BETWEEN SELECT OPTIONS!';

};

ControllerBrutefir.prototype.setUIConfig = function(data) {
 var self = this;

};

ControllerBrutefir.prototype.getConf = function(varName) {
 var self = this;
 //Perform your installation tasks here
};


ControllerBrutefir.prototype.setConf = function(varName, varValue) {
 var self = this;
 //Perform your installation tasks here
};

ControllerBrutefir.prototype.createBRUTEFIRFile = function() {
 var self = this;
 var defer = libQ.defer();
 try {
  fs.readFile(__dirname + "/brutefir.conf.tmpl", 'utf8', function(err, data) {
   if (err) {
    defer.reject(new Error(err));
    return console.log(err);
   }

   var value;
   var devicevalue;
   var sbauer;
   var input_device = 'Loopback,1';
   var filter_path = "/data/INTERNAL/brutefirfilters/";
   var vobaf_filter_path = "/data/INTERNAL/brutefirfilters/VoBAFfilters";
   var leftfilter, leftc2filter;
   var rightfilter, rightc2filter;
   var composeleftfilter = filter_path + self.config.get('leftfilter');
   var composeleftfilter1, composeleftfilter2, composeleftfilter3, composeleftfilter4, composeleftfilter5, composeleftfilter6, composeleftfilter7, composeleftfilter8
   var composerightfilter = filter_path + self.config.get('rightfilter');
   var composerightfilter1, composerightfilter2, composerightfilter3, composerightfilter4, composerightfilter5, composerightfilter6, composerightfilter7, composerightfilter8
   var lattenuation;
   var rattenuation;
   var f_ext;
   var vf_ext;
   var vatt
   if (self.config.get('vatt'))
    //  var f_format = self.config.get('filter_format');

    if (self.config.get('filter_format') == "text") {
     f_ext = ".txt";
    } else if (self.config.get('filter_format') == "FLOAT_LE") {
    f_ext = ".pcm";
   } else if (self.config.get('filter_format') == "FLOAT64_LE") {
    f_ext = ".dbl";
   } else if ((self.config.get('filter_format') == "S16_LE") || (self.config.get('filter_format') == "S24_LE") || (self.config.get('filter_format') == "S32_LE")) {
    f_ext = ".wav";
   }

   if (self.config.get('vobaf_format') == "text") {
    vf_ext = ".txt";
   } else if (self.config.get('vobaf_format') == "FLOAT_LE") {
    vf_ext = ".pcm";
   } else if (self.config.get('vobaf_format') == "FLOAT64_LE") {
    f_ext = ".dbl";
   } else if ((self.config.get('vobaf_format') == "S16_LE") || (self.config.get('vobaf_format') == "S24_LE") || (self.config.get('vobaf_format') == "S32_LE")) {
    vf_ext = ".wav";
   }

   //console.log('ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ' + f_ext);

   // delay calculation section for both channels NO MORE USED!!!!
   var delay
   var sldistance = self.config.get('ldistance');
   var srdistance = self.config.get('rdistance');
   var diff
   var cdelay
   var sample_rate = self.config.get('smpl_rate');
   var sv = 34300 // sound velocity cm/s

   if (sldistance > srdistance) {
    diff = sldistance - srdistance
    cdelay = (diff / sv * sample_rate)
    delay = ('0,' + Math.round(cdelay))
    self.logger.info('l>r ' + delay)
   }
   if (sldistance < srdistance) {
    diff = srdistance - sldistance
    cdelay = (diff / sv * sample_rate)
    delay = (Math.round(cdelay) + ',0')
    self.logger.info('l<r ' + delay)

   }
   if (sldistance == srdistance) {
    self.logger.info('no delay needed');
    delay = ('0,0')
   }

   //-----------------------------------------


   var n_part = self.config.get('numb_part');
   var num_part = parseInt(n_part);
   var f_size = self.config.get('filter_size');
   var filter_size = parseInt(f_size);
   var filtersizedivided = filter_size / num_part;
   var output_device;
   var skipfl;
   var skipfr;
   var vatt = self.config.get('vatt');

   var noldirac = self.config.get('leftfilter');

   if (((self.config.get('filter_format') == "S32_LE") || (self.config.get('filter_format') == "S24_LE") || (self.config.get('filter_format') == "S16_LE")) && (noldirac != "Dirac pulse")) {
    var skipfl = "skip:44;"
   } else skipfl = "";

   var nordirac = self.config.get('rightfilter');

   if (((self.config.get('filter_format') == "S32_LE") || (self.config.get('filter_format') == "S24_LE") || (self.config.get('filter_format') == "S16_LE")) && (noldirac != "Dirac pulse")) {
    var skipfr = "skip:44;"
   } else skipfr = "";
   var routput_device = self.config.get('alsa_device');
   //console.log('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' + routput_device);
   if (routput_device == 'softvolume') {
    output_device = 'softvolume';
   } else {
    output_device = 'hw:' + self.config.get('alsa_device');
   };
   console.log(self.config.get('output_format'));

   var output_formatx
   output_formatx = self.config.get('output_format').replace(/HW-Detected-/g, "").replace(/Factory_/g, "");

   if ((self.config.get('leftfilter') == "Dirac pulse") || (self.config.get('leftfilter') == "None")) {
    composeleftfilter = composeleftfilter2 = composeleftfilter3 = composeleftfilter4 = composeleftfilter5 = composeleftfilter6 = composeleftfilter7 = composeleftfilter8 = "dirac pulse";
   } else leftfilter = filter_path + self.config.get('leftfilter');
   if ((self.config.get('rightfilter') == "Dirac pulse") || (self.config.get('rightfilter') == "None")) {
    composerightfilter = composerightfilter2 = composerightfilter3 = composerightfilter4 = composerightfilter5 = composerightfilter6 = composerightfilter7 = composerightfilter8 = "dirac pulse";
   } else rightfilter = filter_path + self.config.get('rightfilter');


   //--------VoBAF section
   var vobaf = self.config.get('vobaf');

   var skipflv;
   var skipfrv;
   var vatt = self.config.get('vatt');
   if (vobaf == false) {
    composeleftfilter1 = composeleftfilter2 = composeleftfilter3 = composeleftfilter4 = composeleftfilter5 = composeleftfilter6 = composeleftfilter7 = composeleftfilter8 = composerightfilter1 = composerightfilter2 = composerightfilter3 = composerightfilter4 = composerightfilter5 = composerightfilter6 = composerightfilter7 = composerightfilter8 = "dirac pulse";

    skipflv = skipfrv = "";
    vatt = '0';
   } else {

    if (self.config.get('Lowsw') == true) {
     composeleftfilter2 = composerightfilter2 = vobaf_filter_path + '/Low' + vf_ext;
     skipflv = skipfrv;
    } else {
     composeleftfilter2 = composerightfilter2 = "dirac pulse";
     skipflv = skipfrv = ""
    }

    if (self.config.get('LM1sw') == true) {
     composeleftfilter3 = composerightfilter3 = vobaf_filter_path + '/LM1' + vf_ext;
     skipflv = skipfrv = skipfl;
    } else {
     composeleftfilter3 = composerightfilter3 = "dirac pulse";
     skipflv = skipfrv = ""
    }

    if (self.config.get('LM2sw') == true) {
     composeleftfilter4 = composerightfilter4 = vobaf_filter_path + '/LM2' + vf_ext;
    } else {
     composeleftfilter4 = composerightfilter4 = "dirac pulse";
     skipflv = skipfrv = ""
    };

    if (self.config.get('LM3sw') == true) {
     composeleftfilter8 = composerightfilter8 = vobaf_filter_path + '/LM3' + vf_ext;
    } else {
     composeleftfilter8 = composerightfilter8 = "dirac pulse";
     skipflv = skipfrv = ""
    };

    composeleftfilter5 = composerightfilter5 = vobaf_filter_path + '/M' + vf_ext;


    if (self.config.get('HMsw') == true) {

     composeleftfilter6 = composerightfilter6 = vobaf_filter_path + '/HM' + vf_ext;
     skipflv = skipfr;

    } else {
     composeleftfilter6 = composerightfilter6 = "dirac pulse";
     skipflv = skipfrv = "";
    }

    if (self.config.get('Highsw') == true) {
     composeleftfilter7 = composerightfilter7 = vobaf_filter_path + '/High' + vf_ext;

    } else {
     composeleftfilter7 = composerightfilter7 = "dirac pulse";
     skipflv = skipfrv = "";
    }

   };

   //------ Multichannels section-------


   var enablec2;
   var nchannels;
   var enablefc2, enablefc3, enablefc4, enablefc5, enablefc6, enablefc7;
   var lc1delay, rc1delay, lc2delay, rc2delay, lc3delay, rc3delay, lc4delay, rc4delay;
   var calc1delay, carc1delay, calc2delay, carc2delay, calc3delay, carc3delay, calc4delay, carc4delay;
   var tcdelay, tc2delay, tc3delay, tc4delay, tc5delay, tc6delay, tc7delay, tc8delay;
   var composeleftc2filter, composerightc2filter, composeleftc3filter, composerightc3filter, composeleftc4filter, composerightc4filter;

   calc1delay = (Math.round(self.config.get('lc1delay') / 1000 * sample_rate));
   carc1delay = (Math.round(self.config.get('rc1delay') / 1000 * sample_rate));
   calc2delay = (Math.round(self.config.get('lc2delay') / 1000 * sample_rate));
   carc2delay = (Math.round(self.config.get('rc2delay') / 1000 * sample_rate));
   calc3delay = (Math.round(self.config.get('lc3delay') / 1000 * sample_rate));
   carc3delay = (Math.round(self.config.get('rc3delay') / 1000 * sample_rate));
   calc4delay = (Math.round(self.config.get('lc4delay') / 1000 * sample_rate));
   carc4delay = (Math.round(self.config.get('rc4delay') / 1000 * sample_rate));


   var tc2delay = 'delay:' + calc1delay + ',' + carc1delay;
   var tc3delay = 'delay:' + calc1delay + ',' + carc1delay + ',' + calc2delay;
   var tc4delay = 'delay:' + calc1delay + ',' + carc1delay + ',' + calc2delay + ',' + carc2delay;
   var tc5delay = 'delay:' + calc1delay + ',' + carc1delay + ',' + calc2delay + ',' + carc2delay + ',' + calc3delay;
   var tc6delay = 'delay:' + calc1delay + ',' + carc1delay + ',' + calc2delay + ',' + carc2delay + ',' + calc3delay + ',' + carc3delay;
   var tc7delay = 'delay:' + calc1delay + ',' + carc1delay + ',' + calc2delay + ',' + carc2delay + ',' + calc3delay + ',' + carc3delay + ',' + calc4delay;
   var tc8delay = 'delay:' + calc1delay + ',' + carc1delay + ',' + calc2delay + ',' + carc2delay + ',' + calc3delay + ',' + carc3delay + ',' + calc4delay + ',' + carc4delay;

   if ((self.config.get('addchannels') == true) && (self.config.get('nchannels') == '3')) {
    enablec2 = ',"l_c3_out" ';
    nchannels = "channels: 3/0,1,2;";
    enablefc2 = "";
    tcdelay = tc3delay;
    var tolfilters = 'l_out","lc2_out';
    var torfilters = 'r_out';
   }

   if ((self.config.get('addchannels') == true) && (self.config.get('nchannels') == '4')) {
    enablec2 = ',"l_c2_out","r_c2_out" ';
    nchannels = "channels: 4/0,1,2,3;";
    enablefc2 = enablefc3 = "";
    tcdelay = tc4delay
    var tolfilters = 'l_out","l_c2_out';
    var torfilters = 'r_out","r_c2_out';
   }
   if ((self.config.get('addchannels') == true) && (self.config.get('nchannels') == '5')) {
    enablec2 = ',"l_c2_out","r_c2_out","l_c3_out" ';
    nchannels = "channels: 5/0,1,2,3,4;";
    enablefc2 = enablefc3 = enablefc4 = "";
    tcdelay = tc5delay
    var tolfilters = 'l_out","l_c2_out,"l_c3_out';
    var torfilters = 'r_out","r_c2_out';
   }
   if ((self.config.get('addchannels') == true) && (self.config.get('nchannels') == '6')) {
    enablec2 = ',"l_c2_out","r_c2_out","l_c3_out","r_c3_out" ';
    nchannels = "channels: 6/0,1,2,3,4,5;";
    enablefc2 = enablefc3 = enablefc4 = enablefc5 = "";
    tcdelay = tc6delay
    var tolfilters = 'l_out","l_c2_out","l_c3_out';
    var torfilters = 'r_out","r_c2_out","r_c3_out';
   }
   if ((self.config.get('addchannels') == true) && (self.config.get('nchannels') == '7')) {
    enablec2 = ',"l_c2_out","r_c2_out","l_c3_out","r_c3_out","l_c4_out" ';
    nchannels = "channels: 7/0,1,2,3,4,5,6;";
    enablefc2 = enablefc3 = enablefc4 = enablefc5 = enablefc6 = "";
    tcdelay = tc7delay
    var tolfilters = 'l_out","l_c2_out","l_c3_out","l_c4_out';
    var torfilters = 'r_out","r_c2_out","r_c3_out';
   }
   if ((self.config.get('addchannels') == true) && (self.config.get('nchannels') == '8')) {
    enablec2 = ',"l_c2_out","r_c2_out","l_c3_out","r_c3_out","l_c4_out","r_c4_out" ';
    nchannels = "channels: 8/0,1,2,3,4,5,6,7;";
    enablefc2 = enablefc3 = enablefc4 = enablefc5 = enablefc6 = enablefc7 = "";
    tcdelay = tc8delay
    var tolfilters = 'l_out","l_c2_out","l_c3_out","l_c4_out';
    var torfilters = 'r_out","r_c2_out","r_c3_out","r_c4_out';
   } else {
    nchannels = "channels: 2;";
    enablefc2 = enablefc3 = enablefc4 = enablefc5 = enablefc6 = enablefc7 = "#";
    enablec2 = "";
    tcdelay = tc2delay
    var tolfilters = 'l_out';
    var torfilters = 'r_out';
   };

   if ((self.config.get('leftc2filter') == "Dirac pulse") || (self.config.get('leftc2filter') == "None")) {
    composeleftc2filter = "dirac pulse";
   } else composeleftc2filter = filter_path + self.config.get('leftc2filter');

   if ((self.config.get('rightc2filter') == "Dirac pulse") || (self.config.get('rightc2filter') == "None")) {
    composerightc2filter = "dirac pulse";
   } else composerightc2filter = filter_path + self.config.get('rightc2filter');

   if ((self.config.get('leftc3filter') == "Dirac pulse") || (self.config.get('leftc3filter') == "None")) {
    composeleftc3filter = "dirac pulse";
   } else composeleftc3filter = filter_path + self.config.get('leftc3filter');

   if ((self.config.get('rightc3filter') == "Dirac pulse") || (self.config.get('rightc3filter') == "None")) {
    composerightc3filter = "dirac pulse";
   } else composerightc3filter = filter_path + self.config.get('rightc3filter');

   if ((self.config.get('leftc4filter') == "Dirac pulse") || (self.config.get('leftc4filter') == "None")) {
    composeleftc4filter = "dirac pulse";
   } else composeleftc4filter = filter_path + self.config.get('leftc4filter');

   if ((self.config.get('rightc4filter') == "Dirac pulse") || (self.config.get('rightc4filter') == "None")) {
    composerightc4filter = "dirac pulse";
   } else composerightc4filter = filter_path + self.config.get('rightc4filter');


   //-----Brutefir config file generation----

   let conf = data.replace("${smpl_rate}", self.config.get('smpl_rate'))
    .replace("${filter_size}", filtersizedivided)
    .replace("${numb_part}", num_part)
    .replace("${input_device}", input_device)
    .replace("${delay}", delay)
    .replace("${enablefc2}", enablefc2)
    .replace("${enablefc3}", enablefc3)
    .replace("${enablefc4}", enablefc4)
    .replace("${enablefc5}", enablefc5)
    .replace("${enablefc6}", enablefc6)
    .replace("${enablefc7}", enablefc7)
    .replace("${enablefc2}", enablefc2)
    .replace("${enablefc3}", enablefc3)
    .replace("${enablefc4}", enablefc4)
    .replace("${enablefc5}", enablefc5)
    .replace("${enablefc6}", enablefc6)
    .replace("${enablefc7}", enablefc7)
    .replace("${leftc2filter}", composeleftc2filter)
    .replace("${rightc2filter}", composerightc2filter)
    .replace("${leftc3filter}", composeleftc3filter)
    .replace("${rightc3filter}", composerightc3filter)
    .replace("${leftc4filter}", composeleftc4filter)
    .replace("${rightc4filter}", composerightc4filter)
    .replace("${attenuationlr2}", self.config.get('attenuationlr2'))
    .replace("${attenuationlr2}", self.config.get('attenuationlr2'))
    .replace("${attenuationlr3}", self.config.get('attenuationlr3'))
    .replace("${attenuationlr3}", self.config.get('attenuationlr3'))
    .replace("${attenuationlr4}", self.config.get('attenuationlr4'))
    .replace("${attenuationlr4}", self.config.get('attenuationlr4'))
    .replace("${filter_format1}", self.config.get('filter_format'))
    .replace("${filter_format1}", self.config.get('filter_format'))
    .replace("${filter_format1}", self.config.get('filter_format'))
    .replace("${filter_format1}", self.config.get('filter_format'))
    .replace("${filter_format1}", self.config.get('filter_format'))
    .replace("${filter_format1}", self.config.get('filter_format'))
    .replace("${skip_c2}", skipfr)
    .replace("${skip_c2}", skipfr)
    .replace("${skip_c2}", skipfr)
    .replace("${skip_c2}", skipfr)
    .replace("${skip_c2}", skipfr)
    .replace("${skip_c2}", skipfr)
    .replace("${tolfilters}", tolfilters)
    .replace("${torfilters}", torfilters)
    .replace("${leftfilter}", composeleftfilter)
    .replace("${filter_format1}", self.config.get('filter_format'))
    .replace("${skip_1}", skipfl)
    .replace("${lattenuation}", self.config.get('attenuation'))
    .replace("${leftfilter}", composeleftfilter2)
    .replace("${filter_format1}", self.config.get('vobaf_format'))
    .replace("${skip_1}", skipflv)
    .replace("${lattenuation}", vatt)
    .replace("${leftfilter}", composeleftfilter3)
    .replace("${filter_format1}", self.config.get('vobaf_format'))
    .replace("${skip_1}", skipflv)
    .replace("${lattenuation}", vatt)
    .replace("${leftfilter}", composeleftfilter4)
    .replace("${filter_format1}", self.config.get('vobaf_format'))
    .replace("${skip_1}", skipflv)
    .replace("${lattenuation}", vatt)
    .replace("${leftfilter}", composeleftfilter8)
    .replace("${filter_format1}", self.config.get('vobaf_format'))
    .replace("${skip_1}", skipflv)
    .replace("${lattenuation}", vatt)
    .replace("${leftfilter}", composeleftfilter5)
    .replace("${filter_format1}", self.config.get('vobaf_format'))
    .replace("${skip_1}", skipflv)
    .replace("${lattenuation}", vatt)
    .replace("${leftfilter}", composeleftfilter6)
    .replace("${filter_format1}", self.config.get('vobaf_format'))
    .replace("${skip_1}", skipflv)
    .replace("${lattenuation}", vatt)
    .replace("${leftfilter}", composeleftfilter7)
    .replace("${filter_format1}", self.config.get('vobaf_format'))
    .replace("${skip_1}", skipflv)
    .replace("${lattenuation}", vatt)
    .replace("${rightfilter}", composerightfilter)
    .replace("${filter_format2}", self.config.get('filter_format'))
    .replace("${skip_2}", skipfr)
    .replace("${rattenuation}", self.config.get('attenuation'))
    .replace("${rightfilter}", composerightfilter2)
    .replace("${filter_format2}", self.config.get('vobaf_format'))
    .replace("${skip_2}", skipfrv)
    .replace("${rattenuation}", vatt)
    .replace("${rightfilter}", composerightfilter3)
    .replace("${filter_format2}", self.config.get('vobaf_format'))
    .replace("${skip_2}", skipfrv)
    .replace("${rattenuation}", vatt)
    .replace("${rightfilter}", composerightfilter4)
    .replace("${filter_format2}", self.config.get('vobaf_format'))
    .replace("${skip_2}", skipfrv)
    .replace("${rattenuation}", vatt)
    .replace("${rightfilter}", composerightfilter8)
    .replace("${filter_format2}", self.config.get('vobaf_format'))
    .replace("${skip_2}", skipfrv)
    .replace("${rattenuation}", vatt)
    .replace("${rightfilter}", composerightfilter5)
    .replace("${filter_format2}", self.config.get('vobaf_format'))
    .replace("${skip_2}", skipfrv)
    .replace("${rattenuation}", vatt)
    .replace("${rightfilter}", composerightfilter6)
    .replace("${filter_format2}", self.config.get('vobaf_format'))
    .replace("${skip_2}", skipfrv)
    .replace("${rattenuation}", vatt)
    .replace("${rightfilter}", composerightfilter7)
    .replace("${filter_format2}", self.config.get('vobaf_format'))
    .replace("${skip_2}", skipfrv)
    .replace("${rattenuation}", vatt)
    .replace("${enablec2}", enablec2)
    .replace("${output_device}", output_device)
    .replace("${output_format}", output_formatx)
    .replace("${nchannels}", nchannels)
    .replace("${tdelay}", tcdelay);
   fs.writeFile("/data/configuration/audio_interface/brutefir/volumio-brutefir-config", conf, 'utf8', function(err) {
    if (err)
     defer.reject(new Error(err));
    else defer.resolve();
   });
  });

 } catch (err) {

 }

 return defer.promise;

};


//here we save the brutefir config.json
ControllerBrutefir.prototype.saveBrutefirconfigAccount2 = function(data) {
 var self = this;
 var output_device
 var input_device = "Loopback,1";
 output_device = self.config.get('alsa_device');
 var defer = libQ.defer();
 self.config.set('attenuation', data['attenuation'].value);
 self.config.set('leftfilter', data['leftfilter'].value);
 self.config.set('lc1delay', data['lc1delay']);
 self.config.set('rightfilter', data['rightfilter'].value);
 self.config.set('rc1delay', data['rc1delay']);
 self.config.set('addchannels', data['addchannels']);
 self.config.set('leftc2filter', data['leftc2filter'].value);
 self.config.set('lc2delay', data['lc2delay']);
 self.config.set('rightc2filter', data['rightc2filter'].value);
 self.config.set('rc2delay', data['rc2delay']);
 self.config.set('attenuationlr2', data['attenuationlr2'].value);
 self.config.set('leftc3filter', data['leftc3filter'].value);
 self.config.set('lc3delay', data['lc3delay']);
 self.config.set('rightc3filter', data['rightc3filter'].value);
 self.config.set('rc3delay', data['rc3delay']);
 self.config.set('attenuationlr3', data['attenuationlr3'].value);
 self.config.set('leftc4filter', data['leftc4filter'].value);
 self.config.set('lc4delay', data['lc4delay']);
 self.config.set('rightc4filter', data['rightc4filter'].value);
 self.config.set('rc4delay', data['rc4delay']);
 self.config.set('attenuationlr4', data['attenuationlr4'].value);
 self.config.set('filter_format', data['filter_format'].value);
 self.config.set('filter_size', data['filter_size'].value);
 self.config.set('smpl_rate', data['smpl_rate'].value);
 //  self.config.set('numb_part', data['numb_part']);
 self.config.set('input_device', data['input_device']);
 self.config.set('output_device', data['output_device']);
 self.config.set('output_format', data['output_format'].value);

 //self.hwinfo()
 self.rebuildBRUTEFIRAndRestartDaemon()

  .then(function(e) {
   self.commandRouter.pushToastMessage('success', "Configuration update", 'The configuration has been successfully updated');
   defer.resolve({});
  })
  .fail(function(e) {
   defer.reject(new Error('Brutefir failed to start. Check your config !'));
   self.commandRouter.pushToastMessage('error', 'Brutefir failed to start. Check your config !');
  })
 return defer.promise;
};

//here we save VoBAf parameters
ControllerBrutefir.prototype.saveVoBAF = function(data) {
 var self = this;
 var defer = libQ.defer();
 var vf_ext;

 if (self.config.get('vobaf_format') == "text") {
  vf_ext = ".txt";
 } else if (self.config.get('vobaf_format') == "FLOAT_LE") {
  vf_ext = ".pcm";
 } else if (self.config.get('vobaf_format') == "FLOAT64_LE") {
  vf_ext = ".dbl";
 } else if ((self.config.get('vobaf_format') == "S16_LE") || (self.config.get('vobaf_format') == "S24_LE") || (self.config.get('vobaf_format') == "S32_LE")) {
  vf_ext = ".wav";
 }

 self.config.set('vobaf', data['vobaf']);
 self.config.set('Lowsw', data['Lowsw']);
 self.config.set('Low', data['Low'].value);
 self.config.set('LM1sw', data['LM1sw']);
 self.config.set('LM1', data['LM1'].value);
 self.config.set('LM2sw', data['LM2sw']);
 self.config.set('LM2', data['LM2'].value);
 self.config.set('LM3sw', data['LM3sw']);
 self.config.set('LM3', data['LM3'].value);
 self.config.set('M', data['M'].value);
 self.config.set('HMsw', data['HMsw']);
 self.config.set('HM', data['HM'].value);
 self.config.set('Highsw', data['Highsw']);
 self.config.set('maxvolume', data['maxvolume'].value);
 self.config.set('vatt', data['vatt'].value);
 self.config.set('vobaf_format', data['vobaf_format'].value);
 self.config.set('messon', data['messon']);

 if (self.config.get('vobaf') == true) {

  var Lowsw = (self.config.get('Lowsw'))
  var LM1sw = (self.config.get('LM1sw'))
  var LM2sw = (self.config.get('LM2sw'))
  var LM3sw = (self.config.get('LM3sw'))
  var HMsw = (self.config.get('HMsw'))
  var Highsw = (self.config.get('Highsw'))

  var Low = (self.config.get('Low'))
  var LM1 = (self.config.get('LM1'))
  var LM2 = (self.config.get('LM2'))
  var LM3 = (self.config.get('LM3'))
  var HM = (self.config.get('HM'))
  var M = (self.config.get('M'))

  if ((Lowsw == true) && (LM1sw == false)) {
   console.log('ARCHTUNG !!!!!!!!!!!!!!!!!' + Lowsw + LM1sw);
   var modalData = {
    title: 'VoBAF filters activation',
    message: 'Warning !! LM1, LM2 and LM3 Must be enabled if you want to use Low filter',
    size: 'lg',
    buttons: [{
     name: 'Close',
     class: 'btn btn-warning'
    }, ]
   };
   self.commandRouter.broadcastMessage("openModal", modalData);
  } else if ((LM1sw == true) && (LM2sw == false)) {
   console.log('ARCHTUNG !!!!!!!!!!!!!!!!!' + LM1sw + LM2sw);
   var modalData = {
    title: 'VoBAF filters activation',
    message: 'Warning !! LM2 and LM3 Must be enabled if you want to use LM1 filter',
    size: 'lg',
    buttons: [{
     name: 'Close',
     class: 'btn btn-warning'
    }, ]
   };
   self.commandRouter.broadcastMessage("openModal", modalData);
  } else if ((LM2sw == true) && (LM3sw == false)) {
   console.log('ARCHTUNG !!!!!!!!!!!!!!!!!' + LM1sw + LM2sw);
   var modalData = {
    title: 'VoBAF filters activation',
    message: 'Warning !! LM3 Must be enabled if you want to use LM2 filter',
    size: 'lg',
    buttons: [{
     name: 'Close',
     class: 'btn btn-warning'
    }, ]
   };
   self.commandRouter.broadcastMessage("openModal", modalData);
  } else if ((Highsw == true) && (HMsw == false)) {
   console.log('ARCHTUNG !!!!!!!!!!!!!!!!!' + Highsw + HMsw);
   var modalData = {
    title: 'VoBAF filters activation',
    message: 'Warning !! HM Must be enabled if you want to use High filter',
    size: 'lg',
    buttons: [{
     name: 'Close',
     class: 'btn btn-warning'
    }, ]
   };
   self.commandRouter.broadcastMessage("openModal", modalData);
  } else if ((Lowsw == true) && (fs.existsSync('/data/INTERNAL/brutefirfilters/VoBAFfilters/Low' + vf_ext) == !true)) {
   var modalData = {
    title: 'VoBAF filters activation',
    message: 'Warning !! Low' + vf_ext + ' Must exist in /data/INTERNAL/brutefirfilters/VoBAFfilters if you want to use Low filter',
    size: 'lg',
    buttons: [{
     name: 'Close',
     class: 'btn btn-warning'
    }, ]
   };
   self.commandRouter.broadcastMessage("openModal", modalData);
  } else if ((LM1sw == true) && (fs.existsSync('/data/INTERNAL/brutefirfilters/VoBAFfilters/LM1' + vf_ext) == !true)) {
   var modalData = {
    title: 'VoBAF filters activation',
    message: 'Warning !! LM1' + vf_ext + ' Must exist in /data/INTERNAL/brutefirfilters/VoBAFfilters if you want to use LM1 filter',
    size: 'lg',
    buttons: [{
     name: 'Close',
     class: 'btn btn-warning'
    }, ]
   };
   self.commandRouter.broadcastMessage("openModal", modalData);
  } else if ((LM2sw == true) && (fs.existsSync('/data/INTERNAL/brutefirfilters/VoBAFfilters/LM2' + vf_ext) == !true)) {
   var modalData = {
    title: 'VoBAF filters activation',
    message: 'Warning !! LM2' + vf_ext + ' Must exist in /data/INTERNAL/brutefirfilters/VoBAFfilters if you want to use LM2 filter',
    size: 'lg',
    buttons: [{
     name: 'Close',
     class: 'btn btn-warning'
    }, ]
   };
   self.commandRouter.broadcastMessage("openModal", modalData);
  } else if ((LM3sw == true) && (fs.existsSync('/data/INTERNAL/brutefirfilters/VoBAFfilters/LM3' + vf_ext) == !true)) {
   var modalData = {
    title: 'VoBAF filters activation',
    message: 'Warning !! LM3' + vf_ext + ' Must exist in /data/INTERNAL/brutefirfilters/VoBAFfilters if you want to use LM3 filter',
    size: 'lg',
    buttons: [{
     name: 'Close',
     class: 'btn btn-warning'
    }, ]
   };
   self.commandRouter.broadcastMessage("openModal", modalData);
  } else if (fs.existsSync('/data/INTERNAL/brutefirfilters/VoBAFfilters/M' + vf_ext) == !true) {
   var modalData = {
    title: 'VoBAF filters activation',
    message: 'Warning !! M' + vf_ext + ' Must exist in /data/INTERNAL/brutefirfilters/VoBAFfilters if you want to use VoBAF',
    size: 'lg',
    buttons: [{
     name: 'Close',
     class: 'btn btn-warning'
    }, ]
   };
   self.commandRouter.broadcastMessage("openModal", modalData);
  } else if ((HMsw == true) && (fs.existsSync('/data/INTERNAL/brutefirfilters/VoBAFfilters/HM' + vf_ext) == !true)) {
   var modalData = {
    title: 'VoBAF filters activation',
    message: 'Warning !! HM' + vf_ext + ' Must exist in /data/INTERNAL/brutefirfilters/VoBAFfilters if you want to use HM filter',
    size: 'lg',
    buttons: [{
     name: 'Close',
     class: 'btn btn-warning'
    }, ]
   };
   self.commandRouter.broadcastMessage("openModal", modalData);
  } else if ((Highsw == true) && (fs.existsSync('/data/INTERNAL/brutefirfilters/VoBAFfilters/High' + vf_ext) == !true)) {
   var modalData = {
    title: 'VoBAF filters activation',
    message: 'Warning !! High' + vf_ext + ' Must exist in /data/INTERNAL/brutefirfilters/VoBAFfilters if you want to use High filter',
    size: 'lg',
    buttons: [{
     name: 'Close',
     class: 'btn btn-warning'
    }, ]
   };
   self.commandRouter.broadcastMessage("openModal", modalData);
  } else if ((Lowsw == true) && (parseInt(Low) >= parseInt(LM1))) {

   var modalData = {
    title: 'VoBAF filters activation',
    message: 'Warning !! Low threshold must be less than LM1 threshold',
    size: 'lg',
    buttons: [{
     name: 'Close',
     class: 'btn btn-warning'
    }, ]
   };
   self.commandRouter.broadcastMessage("openModal", modalData);
  } else if ((LM1sw == true) && (parseInt(LM1) >= parseInt(LM2))) {

   var modalData = {
    title: 'VoBAF filters activation',
    message: 'Warning !! LM1 threshold must be less than LM2 threshold',
    size: 'lg',
    buttons: [{
     name: 'Close',
     class: 'btn btn-warning'
    }, ]
   };
   self.commandRouter.broadcastMessage("openModal", modalData);
  } else if ((LM2sw == true) && (parseInt(LM2) >= parseInt(LM3))) {

   var modalData = {
    title: 'VoBAF filters activation',
    message: 'Warning !! LM2 threshold must be less than LM3 threshold',
    size: 'lg',
    buttons: [{
     name: 'Close',
     class: 'btn btn-warning'
    }, ]
   };
   self.commandRouter.broadcastMessage("openModal", modalData);
  } else if ((LM3sw == true) && (parseInt(LM3) >= parseInt(M))) {

   var modalData = {
    title: 'VoBAF filters activation',
    message: 'Warning !! LM3 threshold must be less than H threshold',
    size: 'lg',
    buttons: [{
     name: 'Close',
     class: 'btn btn-warning'
    }, ]
   };
   self.commandRouter.broadcastMessage("openModal", modalData);
  } else if ((HMsw == true) && (parseInt(M) >= parseInt(HM))) {

   var modalData = {
    title: 'VoBAF filters activation',
    message: 'Warning !! M threshold must be less than HM threshold',
    size: 'lg',
    buttons: [{
     name: 'Close',
     class: 'btn btn-warning'
    }, ]
   };
   self.commandRouter.broadcastMessage("openModal", modalData);
  }


  //console.log(Lowsw + Low + LM1 + 'rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr');
 }
 //else {
 setTimeout(function() {
  self.rebuildBRUTEFIRAndRestartDaemon()

   .then(function(e) {
    self.commandRouter.pushToastMessage('success', "Configuration update", 'The configuration has been successfully updated');
    //self.sendvolumelevel();
    defer.resolve({});
   })
   .fail(function(e) {
    defer.reject(new Error('Brutefir failed to start. Check your config !'));
    self.commandRouter.pushToastMessage('error', 'Brutefir failed to start. Check your config !');
   })
 }, 500);

 //}
 return defer.promise;
};


//here we save the brutefir delay calculation NOT IN USE NOW!!!
ControllerBrutefir.prototype.saveBrutefirconfigroom = function(data) {
 var self = this;
 var defer = libQ.defer();

 self.config.set('ldistance', data['ldistance']);
 self.config.set('rdistance', data['rdistance']);


 self.rebuildBRUTEFIRAndRestartDaemon()
  .then(function(e) {
   self.commandRouter.pushToastMessage('success', "Configuration update", 'The configuration has been successfully updated');
   defer.resolve({});
  })
  .fail(function(e) {
   defer.reject(new Error('Brutefir failed to start. Check your config !'));
   self.commandRouter.pushToastMessage('error', 'Brutefir failed to start. Check your config !');
  })
 return defer.promise;
};

//here we download and install tools
ControllerBrutefir.prototype.installtools = function(data) {
 var self = this;
 var modalData = {
  title: 'Tools installation',
  message: 'Your are going to download about 17Mo. Please WAIT until this page is refreshed (about 25 sec).',
  size: 'lg'
 };
 self.commandRouter.broadcastMessage("openModal", modalData);
 return new Promise(function(resolve, reject) {
  try {
   var cp3 = execSync('/usr/bin/wget -P /tmp https://github.com/balbuze/volumio-plugins/raw/master/plugins/audio_interface/brutefir3/tools/tools.tar.xz');
   var cp4 = execSync('/bin/mkdir /data/plugins/audio_interface/brutefir/tools');
   var cp5 = execSync('tar -xvf /tmp/tools.tar.xz -C /data/plugins/audio_interface/brutefir/tools');
   var cp6 = execSync('/bin/rm /tmp/tools.tar.xz*');
   var cp7 = execSync('/bin/rm /data/plugins/audio_interface/brutefir/UIConfig.json');

   var cp8 = execSync('/bin/cp /data/plugins/audio_interface/brutefir/UIConfig.json.tools /data/plugins/audio_interface/brutefir/UIConfig.json');
  } catch (err) {
   self.logger.info('An error occurs while downloading or installing tools');
   self.commandRouter.pushToastMessage('error', 'An error occurs while downloading or installing tools');
  }
  resolve();
  self.commandRouter.pushToastMessage('success', 'Files succesfully Installed !', 'Refresh the page to see them');
  return self.commandRouter.reloadUi();
 });
};

//here we remove tools
ControllerBrutefir.prototype.removetools = function(data) {
 var self = this;
 self.commandRouter.pushToastMessage('info', 'Remove progress, please wait!');
 return new Promise(function(resolve, reject) {
  try {

   var cp6 = execSync('/bin/rm -Rf /data/plugins/audio_interface/brutefir/tools');
   var cp7 = execSync('/bin/rm /data/plugins/audio_interface/brutefir/UIConfig.json');

   var cp8 = execSync('/bin/cp /data/plugins/audio_interface/brutefir/UIConfig.json.base /data/plugins/audio_interface/brutefir/UIConfig.json')
  } catch (err) {
   self.logger.info('An error occurs while removing tools');
   self.commandRouter.pushToastMessage('error', 'An error occurs while removing tools');
  }
  resolve();
  self.commandRouter.pushToastMessage('success', 'Tools succesfully Removed !', 'Refresh the page to see them');
  return self.commandRouter.reloadUi();
 });
};

//here we play left sweep when button is pressed
ControllerBrutefir.prototype.playleftsweepfile = function(track) {
 var self = this;

 self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerBrutefir::clearAddPlayTrack');
 var track = '/data/plugins/audio_interface/brutefir/tools/V5.19_MeasSweep_44k_L_refL.WAV';
 var safeUri = track.replace(/"/g, '\\"');
 console.log('RRRRREEEEEEEEEWWWWWWVVVVVVVVEEEEEEERRRRRRRRSSSSSIIIIIIIOOOOOOOOOOON=519');

 var outsample = self.config.get('smpl_rate');
 if (outsample == '44100') {

  //return self.mpdPlugin.sendMpdCommand('stop', [])
  // .then(function() {
  try {
   exec('/usr/bin/killall aplay');
   exec('/usr/bin/aplay --device=plughw:Loopback ' + track);
  } catch (e) {
   console.log('/usr/bin/aplay --device=plughw:Loopback ' + track);
  };
 } else {
  var modalData = {
   title: 'Rew 5.19 - Sweep tools sample rate',
   message: 'Please set sample rate to 44.1kHz and save the configuration in order to use this file',
   size: 'lg',
   buttons: [{
    name: 'Close',
    class: 'btn btn-warning'
   }, ]
  };
  self.commandRouter.broadcastMessage("openModal", modalData);
  //console.log('TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTt ssmaple rate!!!!!!!!!!!'+ outsample);
 }
};


//here we play left sweep when button is pressed
ControllerBrutefir.prototype.playleftsweepfile520 = function(track) {
 var self = this;
 self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerBrutefir::clearAddPlayTrack');
 var track = '/data/plugins/audio_interface/brutefir/tools/V5.20_MeasSweep_44k_L_refL.WAV';
 var safeUri = track.replace(/"/g, '\\"');
 var outsample = self.config.get('smpl_rate');
 if (outsample == '44100') {
  //console.log('RRRRREEEEEEEEEWWWWWWVVVVVVVVEEEEEEERRRRRRRRSSSSSIIIIIIIOOOOOOOOOOON=520'+ outsample);
  //return self.mpdPlugin.sendMpdCommand('stop', [])
  // .then(function() {
  try {
   exec('/usr/bin/killall aplay');
   exec('/usr/bin/aplay --device=plughw:Loopback ' + track);
  } catch (e) {
   console.log('/usr/bin/aplay --device=plughw:Loopback ' + track);
  };
 } else {
  var modalData = {
   title: 'Rew 5.20 - Sweep tools sample rate',
   message: 'Please set sample rate to 44.1kHz and save the configuration in order to use this file',
   size: 'lg',
   buttons: [{
    name: 'Close',
    class: 'btn btn-warning'
   }, ]
  };
  self.commandRouter.broadcastMessage("openModal", modalData);
  //console.log('TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTt ssmaple rate!!!!!!!!!!!'+ outsample);
 }
};
// });



//here we play right sweep when button is pressed
ControllerBrutefir.prototype.playrightsweepfile = function(track) {
 var self = this;
 self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerBrutefir::clearAddPlayTrack');
 var track = '/data/plugins/audio_interface/brutefir/tools/V5.19_MeasSweep_44k_R_refL.WAV';
 var safeUri = track.replace(/"/g, '\\"');
 var outsample = self.config.get('smpl_rate');
 if (outsample == '44100') {
  //console.log('RRRRREEEEEEEEEWWWWWWVVVVVVVVEEEEEEERRRRRRRRSSSSSIIIIIIIOOOOOOOOOOON=520'+ outsample);
  //return self.mpdPlugin.sendMpdCommand('stop', [])
  // .then(function() {
  try {
   exec('/usr/bin/killall aplay');
   exec('/usr/bin/aplay --device=plughw:Loopback ' + track);
  } catch (e) {
   console.log('/usr/bin/aplay --device=plughw:Loopback ' + track);
  };
 } else {
  var modalData = {
   title: 'Rew 5.19 - Sweep tools sample rate',
   message: 'Please set sample rate to 44.1kHz and save the configuration in order to use this file',
   size: 'lg',
   buttons: [{
    name: 'Close',
    class: 'btn btn-warning'
   }, ]
  };
  self.commandRouter.broadcastMessage("openModal", modalData);
  //console.log('TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTt ssmaple rate!!!!!!!!!!!'+ outsample);
 }
};


//here we play right sweep when button is pressed
ControllerBrutefir.prototype.playrightsweepfile520 = function(track) {
 var self = this;
 self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerBrutefir::clearAddPlayTrack');
 var track = '/data/plugins/audio_interface/brutefir/tools/V5.20_MeasSweep_44k_R_refL.WAV';
 var safeUri = track.replace(/"/g, '\\"');
 var outsample = self.config.get('smpl_rate');
 if (outsample == '44100') {
  //console.log('RRRRREEEEEEEEEWWWWWWVVVVVVVVEEEEEEERRRRRRRRSSSSSIIIIIIIOOOOOOOOOOON=520'+ outsample);
  //return self.mpdPlugin.sendMpdCommand('stop', [])
  // .then(function() {
  try {
   exec('/usr/bin/killall aplay');
   exec('/usr/bin/aplay --device=plughw:Loopback ' + track);
  } catch (e) {
   console.log('/usr/bin/aplay --device=plughw:Loopback ' + track);
  };
 } else {
  var modalData = {
   title: 'Rew 5.20 - Sweep tools sample rate',
   message: 'Please set sample rate to 44.1kHz and save the configuration in order to use this file',
   size: 'lg',
   buttons: [{
    name: 'Close',
    class: 'btn btn-warning'
   }, ]
  };
  self.commandRouter.broadcastMessage("openModal", modalData);
  //console.log('TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTt sapmle rate!!!!!!!!!!!'+ outsample);
 }
};

//here we play both channel when button is pressed
ControllerBrutefir.prototype.playbothsweepfile = function(track) {
 var self = this;
 self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerBrutefir::clearAddPlayTrack');
 var track = '/data/plugins/audio_interface/brutefir/tools/512kMeasSweep_20_to_20000_44k_PCM16_LR_refR.wav';
 var safeUri = track.replace(/"/g, '\\"');

 //return self.mpdPlugin.sendMpdCommand('stop', [])
 //.then(function() {
 try {
  exec('/usr/bin/killall aplay');
  exec('/usr/bin/aplay --device=plughw:Loopback ' + track);
 } catch (e) {
  console.log('/usr/bin/aplay --device=plughw:Loopback ' + track)
 };

 //});
};


//here we play both channel when button is pressed
ControllerBrutefir.prototype.playbothsweepfile520 = function(track) {
 var self = this;
 self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerBrutefir::clearAddPlayTrack');
 var track = '/data/plugins/audio_interface/brutefir/tools/512kMeasSweep_20_to_20000_44k_PCM16_LR_refR.wav';
 var safeUri = track.replace(/"/g, '\\"');
 // console.log('RRRRREEEEEEEEEWWWWWWVVVVVVVVEEEEEEERRRRRRRRSSSSSIIIIIIIOOOOOOOOOOON=520');
 //return self.mpdPlugin.sendMpdCommand('stop', [])
 //.then(function() {
 try {
  exec('/usr/bin/killall aplay');
  exec('/usr/bin/aplay --device=plughw:Loopback ' + track);
 } catch (e) {
  console.log('/usr/bin/aplay --device=plughw:Loopback ' + track)
 };

 //});
};

//here we play left pink noise channel when button is pressed
ControllerBrutefir.prototype.playleftpinkfile = function(track) {
 var self = this;
 self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerBrutefir::clearAddPlayTrack');
 var track = '/data/plugins/audio_interface/brutefir/tools/PinkNoise_44k_L.WAV';
 var safeUri = track.replace(/"/g, '\\"');
 var outsample = self.config.get('smpl_rate');
 if (outsample == '44100') {
  //console.log('RRRRREEEEEEEEEWWWWWWVVVVVVVVEEEEEEERRRRRRRRSSSSSIIIIIIIOOOOOOOOOOON=520'+ outsample);
  //return self.mpdPlugin.sendMpdCommand('stop', [])
  // .then(function() {
  try {
   exec('/usr/bin/killall aplay');
   exec('/usr/bin/aplay --device=plughw:Loopback ' + track);
  } catch (e) {
   console.log('/usr/bin/aplay --device=plughw:Loopback ' + track);
  };
 } else {
  var modalData = {
   title: 'Pink tools sample rate',
   message: 'Please set sample rate to 44.1kHz and save the configuration in order to use this file',
   size: 'lg',
   buttons: [{
    name: 'Close',
    class: 'btn btn-warning'
   }, ]
  };
  self.commandRouter.broadcastMessage("openModal", modalData);
  //console.log('TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTt sample rate!!!!!!!!!!!'+ outsample);
 }
};

//here we play right pink noise channel when button is pressed
ControllerBrutefir.prototype.playrightpinkfile = function(track) {
 var self = this;
 self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerBrutefir::clearAddPlayTrack');
 var track = '/data/plugins/audio_interface/brutefir/tools/PinkNoise_44k_R.WAV';
 var safeUri = track.replace(/"/g, '\\"');
 var outsample = self.config.get('smpl_rate');
 if (outsample == '44100') {
  //console.log('RRRRREEEEEEEEEWWWWWWVVVVVVVVEEEEEEERRRRRRRRSSSSSIIIIIIIOOOOOOOOOOON=520'+ outsample);
  //return self.mpdPlugin.sendMpdCommand('stop', [])
  // .then(function() {
  try {
   exec('/usr/bin/killall aplay');
   exec('/usr/bin/aplay --device=plughw:Loopback ' + track);
  } catch (e) {
   console.log('/usr/bin/aplay --device=plughw:Loopback ' + track);
  };
 } else {
  var modalData = {
   title: 'Pink tools sample rate',
   message: 'Please set sample rate to 44.1kHz and save the configuration in order to use this file',
   size: 'lg',
   buttons: [{
    name: 'Close',
    class: 'btn btn-warning'
   }, ]
  };
  self.commandRouter.broadcastMessage("openModal", modalData);
  //console.log('TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTt ssmaple rate!!!!!!!!!!!'+ outsample);
 }
};


//here we play both pink noise channels when button is pressed
ControllerBrutefir.prototype.playbothpinkfile = function(track) {
 var self = this;
 self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerBrutefir::clearAddPlayTrack');
 var track = '/data/plugins/audio_interface/brutefir/tools/PinkNoise_48k_16-bit_BOTH.WAV';
 var safeUri = track.replace(/"/g, '\\"');
 var outsample = self.config.get('smpl_rate');
 if (outsample == '44100') {
  //console.log('RRRRREEEEEEEEEWWWWWWVVVVVVVVEEEEEEERRRRRRRRSSSSSIIIIIIIOOOOOOOOOOON=520'+ outsample);
  //return self.mpdPlugin.sendMpdCommand('stop', [])
  // .then(function() {
  try {
   exec('/usr/bin/killall aplay');
   exec('/usr/bin/aplay --device=plughw:Loopback ' + track);
  } catch (e) {
   console.log('/usr/bin/aplay --device=plughw:Loopback ' + track);
  };
 } else {
  var modalData = {
   title: 'Sweep tools sample rate',
   message: 'Please set sample rate to 44.1kHz and save the configuration in order to use this file',
   size: 'lg',
   buttons: [{
    name: 'Close',
    class: 'btn btn-warning'
   }, ]
  };
  self.commandRouter.broadcastMessage("openModal", modalData);
  console.log('TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTt ssmaple rate!!!!!!!!!!!' + outsample);
 }
};

//here we stop aplay
ControllerBrutefir.prototype.stopaplay = function(track) {
 var self = this;
 //self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerBrutefir::clearAddPlayTrack');

 //return self.mpdPlugin.sendMpdCommand('stop', [])
 // .then(function() {
 try {
  exec('/usr/bin/killall aplay');
 } catch (e) {
  self.data.logger('Stopping aplay')
 };
 //  });
};


//here we save value for converted file
ControllerBrutefir.prototype.fileconvert = function(data) {
 var self = this;
 var defer = libQ.defer();
 self.config.set('filetoconvert', data['filetoconvert'].value);
 self.config.set('tc', data['tc'].value);
 self.config.set('drcconfig', data['drcconfig'].value);
 self.config.set('outputfilename', data['outputfilename']);

 self.convert()

 return defer.promise;
};

//here we convert file using sox and generate filter with DRC-FIR
ControllerBrutefir.prototype.convert = function(data) {
 var self = this;
 //var defer = libQ.defer();
 var inpath = "/data/INTERNAL/brutefirfilters/filter-sources/";
 var drcconfig = self.config.get('drcconfig');
 var outpath = "/data/INTERNAL/brutefirfilters/";
 var infile = self.config.get('filetoconvert');
 if (infile != 'choose a file') {

  var outfile = self.config.get('outputfilename')
  if ((outfile == '') || (outfile == 'Empty=name of file to convert')) {
   outfile = infile.replace('.wav', '')
  };
  var targetcurve = ' /usr/share/drc/config/'
  var outsample = self.config.get('smpl_rate');
  var tc = self.config.get('tc');
  if (tc != 'choose a file') {
   var tcsimplified = tc.replace('.txt', '');
   var ftargetcurve
   var curve
   if ((outsample == 44100) || (outsample == 48000) || (outsample == 88200) || (outsample == 96000)) {
    if (outsample == 44100) {
     ftargetcurve = '44.1\\ kHz/';
     curve = '44.1';
    } else if (outsample == 48000) {
     ftargetcurve = '48.0\\ kHz/';
     curve = '48.0';
    } else if (outsample == 88200) {
     ftargetcurve = '88.2\\ kHz/';
     curve = '88.2';
    } else if (outsample == 96000) {
     ftargetcurve = '96.0\\ kHz/';
     curve = '96.0';
    };

    var destfile = (outpath + outfile + "-" + drcconfig + "-" + curve + "kHz-" + tcsimplified + ".pcm");
    var tcpath = "/data/INTERNAL/brutefirfilters/target-curves/"

    try {
     execSync("/usr/bin/sox " + inpath + infile + " -t f32 /tmp/tempofilter.pcm rate -v -s " + outsample);
     self.logger.info("/usr/bin/sox " + inpath + infile + " -t f32 /tmp/tempofilter.pcm rate -v -s " + outsample);
    } catch (e) {
     self.logger.info('input file does not exist ' + e);
     self.commandRouter.pushToastMessage('error', 'Sox fails to convert file' + e);
    };
    try {
     var modalData = {
      title: (destfile + ' filter generation in progress!'),
      message: ' Please WAIT until this page is refreshed (about 1 minute).',
      size: 'lg'
     };
     self.commandRouter.broadcastMessage("openModal", modalData);
     //here we compose cmde for drc
     var composedcmde = ("/usr/bin/drc --BCInFile=/tmp/tempofilter.pcm --PTType=N --PSPointsFile=" + tcpath + tc + " --PSOutFile=" + destfile + targetcurve + ftargetcurve + drcconfig + "-" + curve + ".drc");
     //and execute it...
     execSync(composedcmde);
     self.logger.info(composedcmde);
     self.commandRouter.pushToastMessage('success', 'Filter ' + destfile + ' generated, Refresh the page to see it');
     return self.commandRouter.reloadUi();
    } catch (e) {
     self.logger.info('drc fails to create filter ' + e);
     self.commandRouter.pushToastMessage('error', 'Fails to generate filter, retry with other parameters' + e);
    };
   } else {
    self.commandRouter.pushToastMessage('error', 'fail  !', 'Sample rate must be set to 96Khz maximum', 'for automatic filter generation');
   };
  } else {
   self.commandRouter.pushToastMessage('error', 'fail  !', 'You must choose a target curve!');
  };
 } else {
  self.commandRouter.pushToastMessage('error', 'fail  !', 'You must choose a file to convert!');
 };
};


ControllerBrutefir.prototype.rebuildBRUTEFIRAndRestartDaemon = function() {
 var self = this;
 var defer = libQ.defer();
 self.createBRUTEFIRFile()
  .then(function(e) {
   var edefer = libQ.defer();
   exec("/usr/bin/sudo /bin/systemctl restart brutefir.service", {
    uid: 1000,
    gid: 1000
   }, function(error, stdout, stderr) {
    if (error) {
     //	self.logger.error('Cannot Enable brutefir');
     self.commandRouter.pushToastMessage('error', 'Brutefir failed to start. Check your config !');
    } else {
     //self.logger.error('Brutefir started ! ');
     self.commandRouter.pushToastMessage('success', 'Attempt to start Brutefir...');
     setTimeout(function() {
      socket.emit('mute', '')
      setTimeout(function() {
       socket.emit('unmute', '');
       //socket.emit('volume', '+');
      }, 100);
     }, 3500)
     return defer.promise;
    }
    edefer.resolve();
   });

   return edefer.promise;
  })
  .then(self.startBrutefirDaemon.bind(self))
  .then(function(e) {
   setTimeout(function() {
     self.logger.info("Connecting to daemon");
     // self.brutefirDaemonConnect(defer);
    }, 2000)
    .fail(function(e) {
     //	defer.reject(new Error('Brutefir failed to start. Check your config !'));
     self.commandRouter.pushToastMessage('error', "Brutefir failed to start. Check your config !");
     self.logger.info("Brutefir failed to start. Check your config !");
    });
  });

 return defer.promise;
};

ControllerBrutefir.prototype.setVolumeParameters = function() {
 var self = this;
 // here we set the volume controller in /volumio/app/volumecontrol.js
 // we need to do it since it will be automatically set to the loopback device by alsa controller
 // to retrieve those values we need to save the configuration of the system, found in /data/configuration/audio_interface/alsa_controller/config.json
 // before enabling the loopback device. We do this in saveHardwareAudioParameters(), which needs to be invoked just before brutefir is enabled
 setTimeout(function() {
  //  return new Promise(function(resolve, reject) { 
  //var defer = libQ.defer();
  const settings = {
   // need to set the device that brutefir wants to control volume to
   device: self.config.get('alsa_device'),
   // need to set the device name of the original device brutefir is controlling
   name: self.config.get('alsa_outputdevicename'),
   // Mixer name
   mixer: self.config.get('alsa_mixer'),
   // hardware, software, none
   mixertype: self.config.get('alsa_mixer_type'),
   // max volume setting
   maxvolume: self.config.get('alsa_volumemax'),
   // log or linear
   volumecurve: self.config.get('alsa_volumecurvemode'),
   //
   volumestart: self.config.get('alsa_volumestart'),
   //
   volumesteps: self.config.get('alsa_volumesteps'),
   //
   softvolumenumber: self.config.get('alsa_softvolumenumber')
  }
  console.log(settings)
  // once completed, uncomment

  return self.commandRouter.volumioUpdateVolumeSettings(settings)

 }, 8000);

 //});
 // return defer.promise;
};

ControllerBrutefir.prototype.saveHardwareAudioParameters = function() {
 var self = this;
 var defer = libQ.defer();
 var conf;
 // we save the alsa configuration for future needs here, note we prepend alsa_ to avoid confusion with other brutefir settings
 //volumestart
 conf = self.getAdditionalConf('audio_interface', 'alsa_controller', 'volumestart');
 self.config.set('alsa_volumestart', conf);
 //maxvolume
 conf = self.getAdditionalConf('audio_interface', 'alsa_controller', 'volumemax');
 self.config.set('alsa_volumemax', conf);
 //volumecurve
 conf = self.getAdditionalConf('audio_interface', 'alsa_controller', 'volumecurvemode');
 self.config.set('alsa_volumecurvemode', conf);
 //device
 conf = self.getAdditionalConf('audio_interface', 'alsa_controller', 'outputdevice');
 self.config.set('alsa_device', conf);
 //mixer_type
 conf = self.getAdditionalConf('audio_interface', 'alsa_controller', 'mixer_type');
 self.config.set('alsa_mixer_type', conf);
 //mixer
 conf = self.getAdditionalConf('audio_interface', 'alsa_controller', 'mixer');
 self.config.set('alsa_mixer', conf);
 //volumesteps
 conf = self.getAdditionalConf('audio_interface', 'alsa_controller', 'volumesteps');
 self.config.set('alsa_volumesteps', conf);
 //name
 conf = self.getAdditionalConf('audio_interface', 'alsa_controller', 'outputdevicename');
 self.config.set('alsa_outputdevicename', conf);
 //softvolumenumber
 conf = self.getAdditionalConf('audio_interface', 'alsa_controller', 'softvolumenumber');
 self.config.set('alsa_softvolumenumber', conf);

 return defer.promise;

}

ControllerBrutefir.prototype.setAdditionalConf = function(type, controller, data) {
 var self = this;
 return self.commandRouter.executeOnPlugin(type, controller, 'setConfigParam', data);
};

ControllerBrutefir.prototype.outputDeviceCallback = function() {
 var self = this;
 var defer = libQ.defer();
 setTimeout(function() {
  self.setVolumeParameters()
 }, 4500);
 self.restoreVolumioconfig()
 defer.resolve()
 return defer.promise;
};

//here we set the Loopback output 
ControllerBrutefir.prototype.setLoopbackoutput = function() {
 var self = this;
 var defer = libQ.defer();
 var outputp
 outputp = self.config.get('alsa_outputdevicename')
 var stri = {
  "output_device": {
   "value": "Loopback",
   "label": (outputp + " through brutefir"),
  },
  "mixer_type": {
   "value": self.config.get('alsa_mixer_type'),
   "label": self.config.get('alsa_mixer_type')
  },
  "mixer": {
   "value": self.config.get('alsa_mixer'),
   "label": self.config.get('alsa_mixer')
  },
  "softvolumenumber": {
   "value": self.config.get('alsa_softvolumenumber'),
   "label": self.config.get('alsa_softvolumenubmer')
  }
 }
 setTimeout(function() {
  self.commandRouter.executeOnPlugin('system_controller', 'i2s_dacs', 'disableI2SDAC', '');
  self.commandRouter.executeOnPlugin('audio_interface', 'alsa_controller', 'saveAlsaOptions', stri);
 }, 4500);
 var volumeval = self.config.get('alsa_volumestart')
 if (volumeval != 'disabled') {
  setTimeout(function() {
   exec('/volumio/app/plugins/system_controller/volumio_command_line_client/volumio.sh volume ' + volumeval, {
    uid: 1000,
    gid: 1000,
    encoding: 'utf8'
   }, function(error, stdout, stderr) {
    if (error) {
     self.logger.error('Cannot set startup volume: ' + error);
    } else {
     self.logger.info("Setting volume on startup at " + volumeval);
    }
   });
  }, 8500);
 }
 return defer.promise;
};

//here we restore config of volumio when the plugin is disabled
ControllerBrutefir.prototype.restoresettingwhendisabling = function() {

 var self = this;
 var output_restored = self.config.get('alsa_device')
 var output_label = self.config.get('alsa_outputdevicename')
 var mixert = self.config.get('alsa_mixer')
 var mixerty = self.config.get('mixer_type')
 var str = {
  "output_device": {
   "value": output_restored,
   "label": output_label
  },
  "mixer": {
   "value": mixert,
   "value": mixerty
  }
 }
 self.commandRouter.executeOnPlugin('system_controller', 'i2s_dacs', 'enableI2SDAC', '');
 return self.commandRouter.executeOnPlugin('audio_interface', 'alsa_controller', 'saveAlsaOptions', str);

};

ControllerBrutefir.prototype.getAdditionalConf = function(type, controller, data) {
 var self = this;
 return self.commandRouter.executeOnPlugin(type, controller, 'getConfigParam', data);
}

