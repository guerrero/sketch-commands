'use strict'

var fs = require('fs')
var path = require('path')

exports.pathExists = function pathExists(filePath) {
  var fn = typeof fs.access === 'function' ? fs.accessSync : fs.statSync

  try {
    fn(filePath)
    return true
  } catch (e) {
    return false
  }
}

exports.filterFilesInDirByExtension = function filterFilesInDirByExtension(directory, extension) {
  var dirFiles = fs.readdirSync(directory)
  var extensionRegExp = new RegExp(extension + '$')

  return dirFiles.filter(function(file) {
    return extensionRegExp.test(file)
  })
}

exports.filterFilesInDirByTitleCaseFolder = function filterFilesInDirByTitleCaseFolder(directory) {
  return fs.readdirSync(directory)
    .filter(function(file) {
      return fs.statSync(path.join(directory, file)).isDirectory();
    })
    .filter(function(dir) {
      return dir[0] === dir[0].toUpperCase()
    })
}
