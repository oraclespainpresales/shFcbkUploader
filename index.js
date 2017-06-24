'use strict';

// Module imports
var restify = require('restify')
  , formidable = require('formidable')
  , express = require('express')
  , url = require('url')
  , fs = require('fs')
  , path = require('path')
  , http = require('http')
  , https = require('https')
  , util = require('util')
  , log = require('npmlog-ts')
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

const DEMOZONE = 'MADRID'
    , IMAGES = 'images'
    , UPLOADFOLDER = path.join(__dirname, IMAGES)
    , PORT = 7123
;

const app    = express()
    , router = express.Router()
    , server = http.createServer(app)
;

const URI = '/'
    , UPLOAD = '/upload'
    , SELFIEUPLOAD = '/selfieupload'
    , IDUPLOAD = '/IDupload'
    , LOGO = 'https://documents-gse00011668.documents.us2.oraclecloud.com/documents/link/web?IdcService=GET_FILE&dLinkID=LF74603357B68766C445D9DA1589C7A5FB5CB4FE98AE&item=fFileGUID:DD18A696F0F98758F302695F1589C7A5FB5CB4FE98AE';
;

const SELFIE = 'SELFIE'
    , ID = 'DNI'
;

const soaClient = restify.createJSONClient({
  url: 'http://new.soa.digitalpracticespain.com'
});
const UPSERTIDENTITYURI = '/SH_APEX_Helper/UpsertIdentityService/customer/identity';


const SELF = 'http://new.proxy.digitalpracticespain.com:' + PORT + '/' + IMAGES + '/';

const HTMLASKSELFIE = '<title>WEDO Hotels</title><meta name="viewport" content="width=device-width"><style>.bootstrap-frm{margin-left:auto; margin-right:auto; max-width: 500px; background: #FFF; padding: 20px 30px 20px 30px; font: 12px "Helvetica Neue", Helvetica, Arial, sans-serif; color: #888; text-shadow: 1px 1px 1px #FFF; border:1px solid #DDD; border-radius: 5px; -webkit-border-radius: 5px; -moz-border-radius: 5px;}.bootstrap-frm h1{font: 25px "Helvetica Neue", Helvetica, Arial, sans-serif; padding: 0px 0px 10px 40px; display: block; border-bottom: 1px solid #DADADA; margin: -10px -30px 30px -30px; color: #888;}.bootstrap-frm h1>span{display: block; font-size: 11px;}.bootstrap-frm input[type="file"]{top: 150px; width: 250px; padding: 10px; -webkit-border-radius: 5px; -moz-border-radius: 5px; border: 1px dashed #BBB; text-align: center; background-color: #DDD; cursor:pointer;}}.bootstrap-frm input[type="submit"]{background: #FFF; border: 1px solid #CCC; padding: 10px 25px 10px 25px; color: #333; border-radius: 4px;}.bootstrap-frm .button:hover{color: #333; background-color: #EBEBEB; border-color: #ADADAD;}</style><form action="selfieupload" method="post" enctype="multipart/form-data" class="bootstrap-frm"><h1><center><img src="' + LOGO + '" width="60px"> Hotels</center></h1><h3><center>This a secure connection</center></h3><center><span>Please, upload a Selfie.<br><br></span></center><input type="hidden" value="%s" name="user"/><input type="hidden" value="%s" name="corrId"/><center><input type="file" name="filetoupload"></center><br><br><center><input type="submit"></center></form>';
const HTMLASKID='<title>WEDO Hotels</title><meta name="viewport" content="width=device-width"><style>.bootstrap-frm{margin-left:auto; margin-right:auto; max-width: 500px; background: #FFF; padding: 20px 30px 20px 30px; font: 12px "Helvetica Neue", Helvetica, Arial, sans-serif; color: #888; text-shadow: 1px 1px 1px #FFF; border:1px solid #DDD; border-radius: 5px; -webkit-border-radius: 5px; -moz-border-radius: 5px;}.bootstrap-frm h1{font: 25px "Helvetica Neue", Helvetica, Arial, sans-serif; padding: 0px 0px 10px 40px; display: block; border-bottom: 1px solid #DADADA; margin: -10px -30px 30px -30px; color: #888;}.bootstrap-frm h1>span{display: block; font-size: 11px;}.bootstrap-frm input[type="file"]{top: 150px; width: 250px; padding: 10px; -webkit-border-radius: 5px; -moz-border-radius: 5px; border: 1px dashed #BBB; text-align: center; background-color: #DDD; cursor:pointer;}}.bootstrap-frm input[type="submit"]{background: #FFF; border: 1px solid #CCC; padding: 10px 25px 10px 25px; color: #333; border-radius: 4px;}.bootstrap-frm .button:hover{color: #333; background-color: #EBEBEB; border-color: #ADADAD;}</style><form action="IDupload" method="post" enctype="multipart/form-data" class="bootstrap-frm"><input type="hidden" value="%s" name="user"/><input type="hidden" value="%s" name="corrId"/><h1><center><img src="' + LOGO + '" width="60px"> Hotels</center></h1><h1><center>Selfie uploaded!</center></h1><h3><center>This a secure connection</center></h3><center><span>Please, upload your ID.<br><br></span></center><center><input type="file" name="filetoupload"></center><br><br><center><input type="submit"></center></form>';
const HTMLDONE='<title>WEDO Hotels</title><meta name="viewport" content="width=device-width"><style>.bootstrap-frm{margin-left:auto; margin-right:auto; max-width: 500px; background: #FFF; padding: 20px 30px 20px 30px; font: 12px "Helvetica Neue", Helvetica, Arial, sans-serif; color: #888; text-shadow: 1px 1px 1px #FFF; border:1px solid #DDD; border-radius: 5px; -webkit-border-radius: 5px; -moz-border-radius: 5px;}.bootstrap-frm h1{font: 25px "Helvetica Neue", Helvetica, Arial, sans-serif; padding: 0px 0px 10px 40px; display: block; border-bottom: 1px solid #DADADA; margin: -10px -30px 30px -30px; color: #888;}.bootstrap-frm h1>span{display: block; font-size: 11px;}.bootstrap-frm input[type="file"]{top: 150px; width: 250px; padding: 10px; -webkit-border-radius: 5px; -moz-border-radius: 5px; border: 1px dashed #BBB; text-align: center; background-color: #DDD; cursor:pointer;}}.bootstrap-frm input[type="submit"]{background: #FFF; border: 1px solid #CCC; padding: 10px 25px 10px 25px; color: #333; border-radius: 4px;}.bootstrap-frm .button:hover{color: #333; background-color: #EBEBEB; border-color: #ADADAD;}</style><form class="bootstrap-frm"><h1><center><img src="' + LOGO + '" width="60px"> Hotels</center></h1><h3><center>This a secure connection</center></h3><center><h2>Files uploaded sucessfully</h2></center><center>You can <a href="https://www.messenger.com/closeWindow/?image_url=' + LOGO + '&display_text=Closing Window">close</a> this page</center></form><!--%s %s-->';

var images = [];

function processFile(prefix, user, corrId, files) {
  return new Promise((resolve, reject) => {
    var oldpath = files.filetoupload.path;
    var newfile = prefix + '-' + user + '-' + corrId + '-' + files.filetoupload.name;
    var newpath = UPLOADFOLDER + '/'+ newfile;
    log.verbose("", "Uploaded file %s", newpath);
    fs.rename(oldpath, newpath, (err) => {
      if (err) {
        reject(err);
      } else {
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
    processFile(prefix, user, corrId, files)
    .then((file) => {
      images.push({ user: user, type: prefix, file: SELF + file});
      res.status(200).send(util.format(TEMPLATE, user, corrId));
      res.end;
      if (callback) callback();
    })
    .catch((err) => {
      res.status(500).send();
      throw err;
    });
  });
}

function registerPictures() {
  var data = { Identity: [] };
  images.forEach((image) => {
    data.Identity.push( {
      demozone: DEMOZONE,
      customerid: image.user,
      pictureurl: image.file,
      picturetype: image.type
    });
  });
  soaClient.put(UPSERTIDENTITYURI, data, (err, req, res, data) => {
    if (err) {
      log.error("","Error from SOA call: " + err.statusCode);
      return;
    }
    log.verbose("Identities set: " + res.statusCode);
  });
}

router.get(UPLOAD, (req, res) => {
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;
  var corrId = query.corrId;
  var user = query.user;
  images = [];
  res.status(200).send(util.format(HTMLASKSELFIE, user, corrId));
});

router.post(SELFIEUPLOAD, (req, res) => uploadFile(HTMLASKID, SELFIE, req, res));
router.post(IDUPLOAD, (req, res) => uploadFile(HTMLDONE, ID, req, res, registerPictures));

app.use(URI, router);
app.use(URI + IMAGES, express.static(IMAGES));

server.listen(PORT, function() {
  log.info('', "Web Server running on http://localhost:" + PORT + URI);
});