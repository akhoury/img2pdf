var argv = require('optimist').argv
  , path = require('path')
  , fs = require('fs')
  , gm = require('gm')
  , PDFDocument = require('pdfkit')
  , input, output, merge, docs = {}, imgs = {}, io_notice, stats, layout, scale;

var usage = function(notice) {
  if(notice) console.log('\n' + notice);
  console.log(
    '\nUsage: i2p --input [path] --output[path] -m --scale 0.45'
      + '\n-i | --input          : input file OR directory to read'
      + '\n-o | --output         : destination file OR directory of where you would like to save the output file(s)'
      + '\n-m | --merge          : if you want to merge all images in a single pdf file'
      + '\n-s | --scale          : a scale from 0 to 1 (where 1 is 100%) of the image'
      + '\n-h | --help           : displays this message'
  );
};

var addImageToDoc = function (img, doc, params, callback){
  if (typeof params == 'function') {
    callback = params;
    params = {};
  } else {
    //nothing yet
  }
  try {
    doc.image(img, params);
    callback(doc);
    return doc;
  } catch (err){
    console.log(err+'\n'+'Skipping: ' + img);
    return null;
  }
};

if (argv.h || argv.help){
  usage();
  return;
}

input = argv.i || argv.input;
output = argv.o || argv.output;
io_notice = 'You must pass both input and output, if input is a file, output will be a file, same for directories'
  + 'if input is a directory, output will be a directory as well, and don\'t use the same directory nor same file for both arguments';
if (!input || !output) {
  return usage(io_notice);
} else {
  output = path.resolve(output);
  input = path.resolve(input);
  stats = fs.statSync(input);
  if ((!stats.isDirectory() && !stats.isFile()) || (output === input)) {
    return usage(io_notice);
  }
}
merge = argv.m || argv.merge || false;

scale = parseFloat(argv.s || argv.scale || 1.0);
scale = !scale || isNaN(scale) ? null : scale;

if (stats.isDirectory()) {
  var mdoc = new PDFDocument(), moutput = null, params, docParams, files, i;
  fs.mkdir(output, function (err) {
    if (err){console.log(output + " already exists")}
    files = fs.readdirSync(input);
    for( i = 0; i < files.length; ) {
      console.log("[1]gming image, inout: " + input + " file: " + files[i] + " i: " + i);
      gm(path.join(input, files[i])).size(function (err, size) {
        if (err){
          console.log('Gm error:' + err);
        } else {
          console.log("[2]gming image, inout: " + input + " file: " + files[i] + " i: " + i);
          params = {scale: scale ? scale : scale = 1 , width: size.width, height: size.height};
          docParams = { size: [params.width, params.height], layout: params.width > params.height ? 'landscape' : 'portrait',
            margins: 0
          }
          console.log('params: ', params);
          console.log('docParams: ', docParams);
          if(!merge){
            addImageToDoc(path.join(input, files[i]), new PDFDocument(docParams), params, function(doc){
              doc.write(path.join(output, files[i]+'.pdf'));
            });
          } else {
            console.log("addingImgToDoc: ", input, files[i], i);
            addImageToDoc(path.join(input, files[i]), mdoc, params, function(doc){
              if (i == 0){
                mdoc = new PDFDocument(docParams);
              } else if (i != files.length - 1) {
                doc.addPage(docParams);
              } else {
                moutput = path.join(output, 'new_merged_doc_'+ new Date().toString() + '.pdf');
                mdoc.write(moutput);
              }
            });
          }
        }
      });
      i++;
    }
    console.log('All PDFs saved to:' + (moutput ? moutput : output));
  });
} else if (stats.isFile()) {
  var fdoc = new PDFDocument(), foutput = output+'.pdf';
  addImageToDoc(path.join(input), fdoc, {scale: scale}, function(doc){
    doc.write(output);
    console.log('PDF saved to: ' + foutput);
  });
}