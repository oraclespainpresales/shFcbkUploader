'use strict';

// Module imports
var restify = require('restify')
  , formidable = require('formidable')
  , express = require('express')
  , url = require('url')
  , fs = require('fs-extra')
  , path = require('path')
  , http = require('http')
  , https = require('https')
  , util = require('util')
  , glob = require('glob')
  , log = require('npmlog-ts')
  , _ = require('lodash')
;

log.stream = process.stdout;
log.level = 'verbose';
log.timestamp = true;

// Main handlers registration - BEGIN
// Main error handler
process.on('uncaughtException', function (err) {
  log.info("","Uncaught Exception: " + err);
  log.info("","Uncaught Exception: " + err.stack);
});
// Detect CTRL-C
process.on('SIGINT', function() {
  log.info("","Caught interrupt signal");
  log.info("","Exiting gracefully");
  process.exit(2);
});
// Main handlers registration - END

const IMAGES = 'images'
    , UPLOADFOLDER = path.join(__dirname, IMAGES)
    , PORT = 7123
;

const SSLCERTFOLDER = '/u01/ssl';

const options = {
  cert: fs.readFileSync(SSLCERTFOLDER + "/certificate.fullchain.crt").toString(),
  key: fs.readFileSync(SSLCERTFOLDER + "/certificate.key").toString()
};

const app    = express()
    , router = express.Router()
    , server = https.createServer(options, app)
;

const URI = '/'
    , UPLOAD = '/upload'
    , SELFIEUPLOAD = '/selfieupload'
    , IDUPLOAD = '/IDupload'
    , DELETE = '/images/:demozone'
    , LOGO = 'http://infra.wedoteam.io:8080/media/WEDO.png';
;

const SELFIE = 'SELFIE'
    , ID = 'DNI'
;

const soaClient = restify.createJSONClient({
  url: 'http://soa.wedoteam.io'
});
const UPSERTIDENTITYURI = '/SH_APEX_Helper/UpsertIdentityService/customer/identity';
const SOASENDPICTURES = '/soa-infra/resources/default/BOT_Helper!1.0/PreCheckingProcessService/smarthospitality/prechecking/sendpictures';

const dbClient = restify.createClient({
  url: 'https://apex.wedoteam.io',
  rejectUnauthorized: false
});
const DELETEIDENTITIESURI = '/ords/pdb1/smarthospitality/customers/identities/';

//const SELF = 'http://new.proxy.digitalpracticespain.com:' + PORT + '/' + IMAGES + '/';
//const SELF = 'http://fcbkuploader.ngrok.io' + '/' + IMAGES + '/';
const SELF = 'http://infra.wedoteam.io:8080' + '/' + IMAGES + '/';


const HTMLASKSELFIE = '<title>WEDO Hotels</title><meta name="viewport" content="width=device-width"><style>.bootstrap-frm{margin-left:auto; margin-right:auto; max-width: 500px; background: #FFF; padding: 20px 30px 20px 30px; font: 12px "Helvetica Neue", Helvetica, Arial, sans-serif; color: #888; text-shadow: 1px 1px 1px #FFF; border:1px solid #DDD; border-radius: 5px; -webkit-border-radius: 5px; -moz-border-radius: 5px;}.bootstrap-frm h1{font: 25px "Helvetica Neue", Helvetica, Arial, sans-serif; padding: 0px 0px 10px 40px; display: block; border-bottom: 1px solid #DADADA; margin: -10px -30px 30px -30px; color: #888;}.bootstrap-frm h1>span{display: block; font-size: 11px;}.bootstrap-frm input[type="file"]{top: 150px; width: 250px; padding: 10px; -webkit-border-radius: 5px; -moz-border-radius: 5px; border: 1px dashed #BBB; text-align: center; background-color: #DDD; cursor:pointer;}}.bootstrap-frm input[type="submit"]{background: #FFF; border: 1px solid #CCC; padding: 10px 25px 10px 25px; color: #333; border-radius: 4px;}.bootstrap-frm .button:hover{color: #333; background-color: #EBEBEB; border-color: #ADADAD;}</style><form action="selfieupload" method="post" enctype="multipart/form-data" class="bootstrap-frm"><h1><center><img src="' + LOGO + '" width="60px"> Hotels</center></h1><h3><center>This a secure connection</center></h3><center><span>Please, upload a Selfie.<br><br></span></center><input type="hidden" value="%s" name="user"/><input type="hidden" value="%s" name="corrId"/><center><input type="file" name="filetoupload" accept="image/*;capture=camera"></center><br><br><center><input type="submit"></center></form>';
const HTMLASKID='<title>WEDO Hotels</title><meta name="viewport" content="width=device-width"><style>.bootstrap-frm{margin-left:auto; margin-right:auto; max-width: 500px; background: #FFF; padding: 20px 30px 20px 30px; font: 12px "Helvetica Neue", Helvetica, Arial, sans-serif; color: #888; text-shadow: 1px 1px 1px #FFF; border:1px solid #DDD; border-radius: 5px; -webkit-border-radius: 5px; -moz-border-radius: 5px;}.bootstrap-frm h1{font: 25px "Helvetica Neue", Helvetica, Arial, sans-serif; padding: 0px 0px 10px 40px; display: block; border-bottom: 1px solid #DADADA; margin: -10px -30px 30px -30px; color: #888;}.bootstrap-frm h1>span{display: block; font-size: 11px;}.bootstrap-frm input[type="file"]{top: 150px; width: 250px; padding: 10px; -webkit-border-radius: 5px; -moz-border-radius: 5px; border: 1px dashed #BBB; text-align: center; background-color: #DDD; cursor:pointer;}}.bootstrap-frm input[type="submit"]{background: #FFF; border: 1px solid #CCC; padding: 10px 25px 10px 25px; color: #333; border-radius: 4px;}.bootstrap-frm .button:hover{color: #333; background-color: #EBEBEB; border-color: #ADADAD;}</style><form action="IDupload" method="post" enctype="multipart/form-data" class="bootstrap-frm"><input type="hidden" value="%s" name="user"/><input type="hidden" value="%s" name="corrId"/><h1><center><img src="' + LOGO + '" width="60px"> Hotels</center></h1><h1><center>Selfie uploaded!</center></h1><h3><center>This a secure connection</center></h3><center><span>Please, upload your ID.<br><br></span></center><center><input type="file" name="filetoupload" accept="image/*;capture=camera"></center><br><br><center><input type="submit"></center></form>';
const HTMLDONE='<title>WEDO Hotels</title><meta name="viewport" content="width=device-width"><style>.bootstrap-frm{margin-left:auto; margin-right:auto; max-width: 500px; background: #FFF; padding: 20px 30px 20px 30px; font: 12px "Helvetica Neue", Helvetica, Arial, sans-serif; color: #888; text-shadow: 1px 1px 1px #FFF; border:1px solid #DDD; border-radius: 5px; -webkit-border-radius: 5px; -moz-border-radius: 5px;}.bootstrap-frm h1{font: 25px "Helvetica Neue", Helvetica, Arial, sans-serif; padding: 0px 0px 10px 40px; display: block; border-bottom: 1px solid #DADADA; margin: -10px -30px 30px -30px; color: #888;}.bootstrap-frm h1>span{display: block; font-size: 11px;}.bootstrap-frm input[type="file"]{top: 150px; width: 250px; padding: 10px; -webkit-border-radius: 5px; -moz-border-radius: 5px; border: 1px dashed #BBB; text-align: center; background-color: #DDD; cursor:pointer;}}.bootstrap-frm input[type="submit"]{background: #FFF; border: 1px solid #CCC; padding: 10px 25px 10px 25px; color: #333; border-radius: 4px;}.bootstrap-frm .button:hover{color: #333; background-color: #EBEBEB; border-color: #ADADAD;}</style><form class="bootstrap-frm"><h1><center><img src="' + LOGO + '" width="60px"> Hotels</center></h1><h3><center>This a secure connection</center></h3><center><h2>Files uploaded sucessfully</h2></center><center>You can <a href="https://www.messenger.com/closeWindow/?image_url=' + LOGO + '&display_text=Closing Window">close</a> this page</center></form><!--%s %s-->';

var sessions = []; // object that will handle multiple requests indexed by the corrId
//var images = [];
//var corrId = 0;
var DEMOZONE = '';

function processFile(prefix, corrId, user, files) {
  return new Promise((resolve, reject) => {
    var oldpath = files.filetoupload.path;
    var newfile = DEMOZONE + '-' + prefix + '-' + user + '-' + corrId + '-' + files.filetoupload.name;
    var newpath = UPLOADFOLDER + '/'+ newfile;
    log.verbose("", "[%s] Moving file to %s", corrId, newpath);
    fs.move(oldpath, newpath, (err) => {
      if (err) {
        reject(err);
      } else {
        log.verbose("", "[%s] Moved file to %s successfully", corrId, newpath);
        resolve(newfile);
      }
    });
  });
}

function uploadFile(TEMPLATE, prefix, req, res, callback) {
  var form = new formidable.IncomingForm();
  form.parse(req, function(err, fields, files) {
    var user = fields.user;
    var corrId = fields.corrId;
    log.verbose("", "[%s] Request to upload file '%s'...", corrId, prefix);
    log.verbose("", "[%s] File to process: %s %s %j", corrId, prefix, user, files);
    processFile(prefix, corrId, user, files)
    .then((file) => {
      var data = { user: user, type: prefix, file: SELF + file};
      log.verbose("", "[%s] File processed: %j", corrId, data);
      var s = _.find(sessions, { corrId: corrId } );
      if (!s) {
        // No data for the incoming corrId ????
        res.status(500).send();
        throw err;
      }
      s.images.push(data);
      res.status(200).send(util.format(TEMPLATE, user, corrId));
      res.end;
      if (callback) callback(corrId);
    })
    .catch((err) => {
      res.status(500).send();
      throw err;
    });
  });
}

function registerPictures(corrId) {
  var data = { Identity: [] };
  var soaData = { corrId: corrId, pictures: [] };
  var s = _.find(sessions, { corrId: corrId } );
  if (!s) {
    // No data for the incoming corrId ????
    log.error("","Correlation Id %s not found in the current sessions!!: %j", corrId, sessions);
    throw err;
  }
  s.images.forEach((image) => {
    data.Identity.push( {
      demozone: DEMOZONE,
      customerid: image.user,
      pictureurl: image.file,
      picturetype: image.type
    });
    soaData.pictures.push( {
      type: image.type,
      URL: image.file
    });
  });
  log.verbose("","[%s] Data to send to SOA: %s", corrId, JSON.stringify(data));
  soaClient.put(UPSERTIDENTITYURI, data, (err, req, res, data) => {
    if (err) {
      log.error("","Error from " + UPSERTIDENTITYURI + " SOA call: " + err.statusCode);
      return;
    }
    log.verbose("", "[%s] Identities set to DB: %s", corrId, res.statusCode);
    soaClient.post(SOASENDPICTURES, soaData, (err, req, res, data) => {
      if (err) {
        log.error("","[%s] Error from '%s' SOA call: %s", corrId, SOASENDPICTURES, err.statusCode);
        return;
      }
      log.verbose("", "[%s] Identities set to SOA process: %s", corrId, res.statusCode);
      _.remove(sessions, { corrId: corrId });
    });
  });
}

function deleteFiles(req, res) {
  var _demozone = req.params.demozone;
  var filesToDelete = glob.sync(UPLOADFOLDER + '/' + _demozone + '-*');
  log.verbose("About to delete all files under " + UPLOADFOLDER);
  filesToDelete.forEach((f) => {
    fs.unlinkSync(f);
  });
  dbClient.del(DELETEIDENTITIESURI + DEMOZONE, (_err, _req, _res) => {
    if (_err) {
      log.error("","Error from DB call: " + _err.statusCode);
      res.status(_err.statusCode).send();
      return;
    }
    log.verbose("Identities removed");
    res.status(202).send();
  });
}

router.get(UPLOAD, (req, res) => {
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;
  var corrId = query.corrId;
  var user = query.user;
  DEMOZONE = query.demozone.toUpperCase().replace(' ', '');
  _.remove(sessions, { corrId: corrId }); // remove any previous session with same corrId
  sessions.push( { corrId: corrId, images: [] } );
//  images = [];
  log.verbose("", "New request with data: %j", query);
  res.status(200).send(util.format(HTMLASKSELFIE, user, corrId));
});

router.post(SELFIEUPLOAD, (req, res) => uploadFile(HTMLASKID, SELFIE, req, res));
router.post(IDUPLOAD, (req, res) => uploadFile(HTMLDONE, ID, req, res, registerPictures));
router.delete(DELETE, (req, res) => deleteFiles(req, res));

app.use(URI, router);
app.use(URI + IMAGES, express.static(IMAGES));

server.listen(PORT, function() {
  log.info('', "Web Server running on https://localhost:" + PORT + URI);
});
