var com = {}

com.bomberstudios = {
  createFolder: function(path) {
    var fileManager = NSFileManager.defaultManager()
    fileManager.createDirectoryAtPath_withIntermediateDirectories_attributes_error(path, true, nil, nil)
  },
  getFileFolder: function(doc) {
    var fileURL = doc.fileURL()
    var filepath = fileURL.path()
    var fileFolder = filepath.split(doc.displayName())[0]

    return fileFolder
  },
  getExportPath: function(doc) {
    var fileFolder = com.bomberstudios.getFileFolder(doc)
    var exportFolder = fileFolder + (doc.displayName()).split('.sketch')[0] + '_export/'

    return exportFolder
  },
  exportAllSlices: function(format, path, doc) {
    if (typeof path === 'undefined') {
      path = com.bomberstudios.getExportPath(doc)
    }

    function exportLoop() {
      var pages = doc.pages()
      for (var i = 0; i < pages.count(); i++) {
        var page = pages.objectAtIndex(i)
        doc.setCurrentPage(page)
        var pagename = doc.currentPage().name()
        var layers = doc.currentPage().exportableLayers()

        if (layers.count() === 0) {
          doc.showMessage('There is no available slices or exportable layers to export')
          return false
        }

        for (var j = 0; j < layers.count(); j++) {
          var slice = layers.objectAtIndex(j)
          doc.saveArtboardOrSlice_toFile(slice, path + '/' + pagename + '/' + slice.name() + '.' + format)
        }
        return true
      }
    }

    exportLoop()
  },
  exportAllArtboards: function(format, path, doc){
    if (typeof path === 'undefined') {
      path = com.bomberstudios.getExportPath(doc)
    }

    function exportLoop() {
      var pages = doc.pages()
      for (var i = 0; i < pages.count(); i++){
        var page = pages.objectAtIndex(i)
        doc.setCurrentPage(page)
        var pagename = doc.currentPage().name()
        var layers = doc.currentPage().artboards()

        log('Exporting page ' + (i+1) + '/' + pages.count() + ' (' + pagename + ') with ' + layers.count() + ' artboards')

        for (var j = 0; j < layers.count(); j++) {
          var artboard = layers.objectAtIndex(j)
          doc.saveArtboardOrSlice_toFile(artboard, path + '/' + pagename + '/' + artboard.name() + '.' + format)
        }
      }
    }

    exportLoop()
  },
  exportItem: function(item, format, path, doc) {
    var sel = item
    var rect = sel.absoluteInfluenceRect()
    doc.saveArtboardOrSlice_toFile(GKRect.rectWithRect(rect), path + '/' + sel.name() + '.' + format)
  },
  exportItemToDesktop: function(item, format, doc) {
    var desktop = NSSearchPathForDirectoriesInDomains(NSDesktopDirectory, NSUserDomainMask, true).objectAtIndex(0)
    com.bomberstudios.exportItem(item, format, desktop, doc)
  },
  padNumber: function(num) {
    var result = num.toString()
    if (result.length < 2) {
      result = '0' + num
    }
    return result
  },
  isodate: function() {
    var now = new Date()
    var year = now.getFullYear()
    var month = com.bomberstudios.padNumber(now.getMonth() + 1)
    var day = com.bomberstudios.padNumber(now.getDate())
    var hour = com.bomberstudios.padNumber(now.getHours())
    var minute = com.bomberstudios.padNumber(now.getMinutes())
    return year + month + day + hour + minute
  },
  selectionCountIs: function(min) {
    var min = min || 1
    var title = 'Whoops'

    if (selection.count() < min) {
      if (selection.count() === 0) {
        title = 'Nihilism alert'
      }
      doc.showMessage('You need to select at least ' + numberToWords(min) + ' object' + (min === 1 ? '' : 's') + ', but you selected ' + numberToWords(selection.count()) + '.', title)
      return false
    }

    return true
  },
  numberToWords: function(num) {
    switch (num) {
    case 0:
      return 'none'
    case 1:
      return 'one'
    case 2:
      return 'two'
    case 3:
      return 'three'
    case 4:
      return 'four'
    default:
      return num
    }
  },
  openFinderIn: function(path) {
    var openFinder = NSTask.alloc().init()
    var openFinderArgs = NSArray.arrayWithObjects('.', nil)

    openFinder.setCurrentDirectoryPath(path)
    openFinder.setLaunchPath('/usr/bin/open')
    openFinder.setArguments(openFinderArgs)
    openFinder.launch()
  },
  revealFinderIn: function(path) {
    var openFinder = NSTask.alloc().init()
    var openFinderArgs = NSArray.arrayWithObjects('-R', path, nil)

    openFinder.setLaunchPath('/usr/bin/open')
    openFinder.setArguments(openFinderArgs)
    openFinder.launch()
  }
}

Array.prototype.each = function(callback) {
  var count = 0
  for (var i = 0; i < this.length; i++) {
    var el = this[i]
    callback.call(this, el, count)
    count += 1
  }
}

Number.prototype.times = function(callback) {
  for (var s = this - 1; s >= 0; s--) {
    callback.call(this, s)
  }
}

Date.prototype.isoDate = function() {
  return this.year()
}

function toJSArray(arr) {
  var len = arr.count()
  var res = []

  while (len--){
    res.push(arr[len])
  }
  return res
}

// Aliases
numberToWords = com.bomberstudios.numberToWords
selectionCountIs = com.bomberstudios.selectionCountIs
