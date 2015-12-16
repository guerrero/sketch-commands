'use strict'

var fs = require('fs')
var path = require('path')
var message = require('./lib/message')(process.argv[1])
var utils = require('./lib/utils')
var filterFilesInDirByExtension = utils.filterFilesInDirByExtension
var filterFilesInDirByTitleCaseFolder = utils.filterFilesInDirByTitleCaseFolder

var messages = {
  start: 'Starting process...',
  parseError: '. Unable to parse file. There should be an error in its JSON syntax.',
  noManifest: 'There\'s no manifest file into this plugin folder',
  manifestCreated: 'Updated manifest in '
}

var rootDir = path.resolve(__dirname, '..')
var plugins = filterFilesInDirByExtension(rootDir, '.sketchplugin')
var errorMessages = []
var regex = {
  shortcutLine: /(?:@shortcut\s+)(.*?)\s*\n/,
  shortcutValidation: /^(?:(?!(?:.*ctrl){2})(?!(?:.*cmd){2})(?!(?:.*shift){2})(?!(?:.*alt){2})(ctrl|cmd|shift|alt)\s)*[a-z0-9.,\/;[\]'`=-\\]$/
}

function getManifest(directory) {
  try {
    return require(path.join(directory, 'manifest.json'))
  } catch (e) {
    message('ERROR', path.join(directory, 'manifest.json') + message.parseError)
    process.exit(1)
  }
}

function getCommandNameFromFilename(filename) {
  return path.basename(filename, '.cocoascript')
    .replace(/WithArguments/, '…')
    .replace(/([a-z](?=[A-Z0-9]))/g, '$1 ')
}

function checkForValidShortcut(script) {
  var fileContent = fs.readFileSync(script)
  var shortcutMatch = fileContent.toString().match(regex.shortcutLine)

  if (shortcutMatch && shortcutMatch[1]) {
    var shortcut = shortcutMatch[1]

    if (regex.shortcutValidation.test(shortcut)) {
      return shortcut
    }

    var errorMessage = ['`', shortcut, '` is not a valid shortcut for `', script, '` file'].join('')
    errorMessages.push(errorMessage)
  } else {
    return null
  }
}

function writeManifestFile(directory, input) {
  var outputPath = path.join(directory, 'manifest.json')
  if (errorMessages.length === 0) {
    fs.writeFile(outputPath, JSON.stringify(input, null, '  '), function(err) {
      if (err) {
        message('ERROR', err)
      }

      message('SUCCESS', messages.manifestCreated + outputPath)
    })
  } else {
    errorMessages.forEach(function(msg) {
      message('ERROR', msg)
    })
  }
}

message('INFO', messages.start)
plugins.forEach(function(plugin) {
  var pluginDir = path.resolve(__dirname, '../' + plugin + '/Contents/Sketch')
  var pluginDirFiles = fs.readdirSync(pluginDir)
  var manifestExists = pluginDirFiles.indexOf('manifest.json') !== -1
  if (manifestExists) {
    var manifest = getManifest(pluginDir)
    manifest.commands = []
    manifest.menu = {
      isRoot: true,
      items: []
    }

    var scriptsFolders = filterFilesInDirByTitleCaseFolder(pluginDir, pluginDirFiles)
    scriptsFolders.forEach(function(folder, index) {
      var manifestMenuItem = {
        title: folder,
        items: []
      }

      var scripts = fs.readdirSync(path.join(pluginDir,folder))
        .filter(function(file) {return file[0] === file[0].toUpperCase() })

      scripts.forEach(function(script) {
        var commandName = getCommandNameFromFilename(script)

        var manifestCommand = {
          name: commandName,
          identifier: commandName.replace(/ /g, '').toLowerCase(),
          shortcut: checkForValidShortcut(path.join(pluginDir, folder, script)) || '',
          script: path.join(folder, script)
        }

        manifest.commands.push(manifestCommand)
        manifestMenuItem.items.push(manifestCommand.identifier)
      })

      manifest.menu.items.push(manifestMenuItem)

      if (index === scriptsFolders.length - 1) {
        writeManifestFile(pluginDir, manifest)
        message('SUCCESS', 'Done')
      }
    })
  } else {
    message('ERROR', messages.noManifest)
  }
})
