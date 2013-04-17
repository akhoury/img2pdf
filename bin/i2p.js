var argv = require('optimist').argv
  , path = require('path')
  , fs = require('fs')
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
    console.log(images(img).size());
    //doc.image(img, params);
  } catch (err){
    console.log(err+'\n'+'Skipping: ' + img);
    return null;
  }
  callback(doc);
  return doc;
};

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
scale = isNaN(scale) ? 1 : scale;

// process directory parsing
if (stats.isDirectory()) {
  var mdoc = new PDFDocument(), moutput = null;
  fs.mkdir(output, function (err) {
    if (err){console.log(output + " already exists")}
    fs.readdir(input, function (err, files) {
      if (err) error(err);
      files.forEach(function (file) {
        console.log(file);
        if(!merge){
          addImageToDoc(path.join(input, file), new PDFDocument(), {scale: scale, layout: layout}, function(doc){
            doc.write(path.join(output, file+'.pdf'));
          });
        } else {
          addImageToDoc(path.join(input, file), mdoc, {scale: scale}, function(doc){
            doc.addPage();
          });
        }
      });
      if(merge){
        moutput = path.join(output, 'new_merged_doc_'+ new Date().toString() + '.pdf');
        mdoc.write(moutput);
      }
      console.log('All PDFs saved to:' + (moutput ? moutput : output));
    });
  });
} else if (stats.isFile()) {
  var fdoc = new PDFDocument(), foutput = output+'.pdf';
  addImageToDoc(path.join(input), fdoc, {scale: scale}, function(doc){
    doc.write(output);
    console.log('PDF saved to: ' + output);
  });
}