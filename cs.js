if (typeof(g_gpv_rendered) == 'undefined') {
  g_gpv_rendered = true;

  (function() {
    var opINS = 0
    var opDEL = 1
    var opCHANGE = 2
    
    var hasLongLine = false;
    // line is HTML.
    function checkLongLine(line) {
      var text = htmlToText(line);
      var words = text.split(/\s+/);
      words.forEach(function(word) {
        if (word.length > 100) {
          hasLongLine = true;
        }
      });
    }
  
    var outputOneLine = function(out, line, cls) {
      checkLongLine(line);
      return out + '<tr class="' + cls + '"><td colspan="4">' + line + '</td></tr>'
    }
    var outputFileStart = function(out, line, idx) {
      checkLongLine(line);
      return out + '<tr class="filestart"><td colspan="4"><a id="file-' + idx + '"/>' + line + '</td></tr>'
    }
  
    var outputMinus = function(out, num, line) {
      checkLongLine(line);
      return out + '<tr><td class="linenum">' + num + '</td><td class="minusline">' + line + '</td><td class="linenum"></td><td></td></tr>'
    }
    var outputPlus = function(out, num, line) {
      checkLongLine(line);
      return out + '<tr><td class="linenum"></td><td></td><td class="linenum">' + num + '</td><td class="plusline">' + line + '</td></tr>'
    }

    var outputPair = function(out, lnum, lline, rnum, rline) {
      checkLongLine(lline);
      checkLongLine(rline);
      return out + '<tr><td class="linenum">' + lnum + '</td><td class="minusline">' + lline + '</td><td class="linenum">' + rnum + '</td><td class="plusline">' + rline + '</td></tr>'
    }

    var outputSame = function(out, lnum, rnum, line) {
      checkLongLine(line);
      return out + '<tr><td class="linenum">' + lnum + '</td><td>' + line + '</td><td class="linenum">' + rnum + '</td><td>' + line + '</td></tr>'
    }

    var matchingFromOps = function(la, lb, ops) {
      matA = new Array(la)
      matB = new Array(lb)
      for (var i = la, j = lb; i > 0 || j > 0; ) {
        var op
        if (i == 0) {
          op = opINS
        } else if (j == 0) {
          op = opDEL
        } else {
          op = ops[(i-1)*lb+j-1]
        }

        switch (op) {
        case opINS:
          j--
          matB[j] = -1
          break
        case opDEL:
          i--
          matA[i] = -1
          break
        case opCHANGE:
          i--
          j--
          matA[i] = j
          matB[j] = i
          break
        }
      }

      return {
        matA: matA,
        matB: matB
      }
    }
    function ed(a, b) {
      var la = a.length, lb = b.length

      var f = new Array(lb+1)
      var ops = new Array(la*lb)

      f[0] = 0
      for (var j = 1; j <= lb; j++) {
        f[j] = f[j-1] + 1
      }

      // Matching with dynamic programming
      var p = 0
      for (var i = 0; i < la; i++) {
        var fj1 = f[0] // fj1 is the value of f[j - 1] in last iteration
        f[0] += 1
        for (var j = 1; j <= lb; j++) {
          // delete
          var mn = f[j] + 1, op = opDEL

          var v = f[j-1] + 1
          if (v < mn) {
            // insert
            mn = v
            op = opINS
          }

          // change/matched
          v = fj1 + (a[i] == b[j-1] ? 0 : 1)
          if (v < mn) {
            // insert
            mn = v
            op = opCHANGE
          }

          fj1 = f[j]   // save f[j] to fj1(j is about to increase)
          f[j] = mn    // update f[j] to mn
          ops[p] = op

          p++
        }
      }
    
      // Reversely find the match info
      var res = matchingFromOps(la, lb, ops)
      res.dist = f[lb]

      return res
    }
  
    var fPlus = function(s) {
      return '<span class="plus">' + s + '</span>'
    }
    var fMinus = function(s) {
      return '<span class="minus">' + s + '</span>'
    }
  
    var cnvDiv = document.createElement('div');
    var htmlToText = function(html) {
      cnvDiv.innerHTML = html
      return cnvDiv.innerText
    }
    var textToHtml = function(text) {
      cnvDiv.innerText = text
      return cnvDiv.innerHTML
    }

    /**
     * a/b are text not HTML, fMark receive HTML, Return HTML
     */ 
    var mark = function(out, a, b, matA, fMark) {
      var same = '', mk = ''
      for (i = 0; i < a.length; i++) {
        if (matA[i] < 0 || a[i] != b[matA[i]]) {
          if (same) {
            out += textToHtml(same)
            same = ''
          }
          mk += a[i]
        } else {
          if (mk) {
            out += fMark(textToHtml(mk))
            mk = ''
          }
          same += a[i]
        }
      }
      if (same) {
        out += textToHtml(same)
      }
      if (mk) {
        out += fMark(textToHtml(mk))
      }
      return out
    }
            
    var parseLine = function(line, ctx) {
      if (line == '---') {
        return {
          tp: 'line',
          line: line
        }
      }
  
      var m
      m = line.match('^@@ -([0-9]+),([0-9]+) [+]([0-9]+),([0-9]+) @@(.*)$')
      if (m) {
        return {
          tp: 'lineinfo',
          lstart: parseInt(m[1]),
          lcnt: parseInt(m[2]),
          rstart: parseInt(m[3]),
          rcnt: parseInt(m[4]),
          info: m[5]
        }
      }
      m = line.match('^@@ -([0-9]+) [+]0,0 @@(.*)$')
      if (m) {
        return {
          tp: 'lineinfo',
          lstart: 1,
          lcnt: parseInt(m[1]),
          rstart: 1,
          rcnt: 0,
          info: m[2]
        }
      }
      m = line.match('^@@ -0,0 [+]([0-9]+) @@(.*)$')
      if (m) {
        return {
          tp: 'lineinfo',
          lstart: 1,
          lcnt: 0,
          rstart: 1,
          rcnt: parseInt(m[1]),
          info: m[2]
        }
      }
    
      m = line.match('^diff .*$')
      if (m) {
        return {
          tp: 'filestart',
          line: line
        }
      }
      m = line.match('^[+][+][+] (.+)$')
      if (m) {
        return {
          tp: 'plusfile',
          fn: m[1]
        }
      }
      m = line.match('^--- (.+)$')
      if (m) {
        return {
          tp: 'minusfile',
          fn: m[1]
        }
      }
    
      m = line.match('^Subject: (.+)$')
      if (m) {
        return {
          tp: 'subject',
          subject: m[1]
        }
      }
      
      if (!ctx.ready) {
        return {
          tp: 'line',
          line: line
        }
      }
    
      m = line.match('^ (.*)$')
      if (m) {
        return {
          tp: 'sameline',
          line: m[1]
        }
      }
      
      m = line.match('^[+](.*)$')
      if (m) {
        return {
          tp: 'plusline',
          line: m[1]
        }
      }
    
      m = line.match('^[-](.*)$')
      if (m) {
        return {
          tp: 'minusline',
          line: m[1]
        }
      }
    
      return {
        tp: 'line',
        line: line
      }
    }
    
    if (typeof(g_gpv_rendered) != 'undefined') {
    	g_parseLine = parseLine
    }
  
    var clearCtx = function(out, ctx) {
      return out
    }
    
    var files = []
    var subject = ''
    var preList = document.getElementsByTagName('pre')
    for (var i = 0; i < preList.length; i++) {
      var pre = preList[i];
      var out = '';
      var lines = pre.innerHTML.split('\n');
      var buffered = '';
      var ctx = {}
      for (var j = 0; j < lines.length; j++) {
        var line = lines[j];
      
        var info = parseLine(line, ctx)
        console.log(info.tp + ": " + line)
      
        if (info.tp == 'plusline') {
          if (ctx.buffered) {
            var bufferredLine = htmlToText(ctx.buffered.line)
            var curLine = htmlToText(info.line)
            var m = ed(bufferredLine, curLine)
            if (bufferredLine.trim() == curLine.trim() || m.dist < Math.max(bufferredLine.length, curLine.length)/2) {
                out = outputPair(out, ctx.lnum, mark('', bufferredLine, curLine, m.matA, fMinus), ctx.rnum,
                  mark('', curLine, bufferredLine, m.matB, fPlus))
                ctx.lnum++
                ctx.rnum++
            } else {
                out = outputMinus(out, ctx.lnum, ctx.buffered.line)
                ctx.lnum++
                out = outputPlus(out, ctx.rnum, info.line)
                ctx.rnum++
            }
            ctx.buffered = ''
          } else {
            out = outputPlus(out, ctx.rnum, info.line)
            ctx.rnum++
          }
      
          continue
        } else {
          if (ctx.buffered) {
            if (ctx.lnum >= ctx.lend) {
              out = outputOneLine(out, ctx.buffered.line, 'rawline')
            } else {
              out = outputMinus(out, ctx.lnum, ctx.buffered.line)
              ctx.lnum++
            }
            ctx.buffered = ''
          }
      
          if (info.tp == 'subject') {
            subject = info.subject
            continue
          }
          if (info.tp == 'filestart') {
            ctx = {}
            var idx = files.length
            files.push(line)
            out = outputFileStart(out, line, idx)
            continue
          }
          if (info.tp == 'line') {
            out = outputOneLine(out, line, 'rawline')
            continue
          }
          if (info.tp == 'sameline') {
            if (ctx.ready) {
              out = outputSame(out, ctx.lnum, ctx.rnum, info.line)
              ctx.lnum++
              ctx.rnum++
            } else {
              out = outputOneLine(out, line, 'rawline')
            }
            continue
          }
          if (info.tp == 'minusfile') {
            ctx.lfn = info.fn
            continue
          }
          if (info.tp == 'plusfile') {
            ctx.rfn = info.fn
            continue
          }
          if (info.tp == 'lineinfo') {
            if (files.length > 0) {
              if (info.lcnt == 0) {
                files[files.length - 1] = '+ ' + ctx.rfn
              } else if (info.rcnt == 0) {
                files[files.length - 1] = '- ' + ctx.lfn
              } else {
                files[files.length - 1] = 'M ' + ctx.lfn
              }
            }
            ctx.lnum = info.lstart
            ctx.lend = info.lstart + info.lcnt
            ctx.rnum = info.rstart
            ctx.rend = info.rstart + info.rcnt
            ctx.ready = true
            out = outputOneLine(out, line, 'linenums')
            continue
          }
          if (info.tp == 'minusline') {
            ctx.buffered = info
            continue
          }
        }
        out = outputOneLine(out, line, 'rawline')
        console.log(JSON.stringify(info))
      }
      if (subject) {
        out = outputOneLine('', subject, 'subject') + out
      }
      out = '<table>' + out + '</table>'
      var fileLinks = '<div class="filelinks">'
      for (var j = 0; j < files.length; j++) {
        fileLinks += '<a href="#file-' + j + '">' + files[j] + '</a>'
      }
      fileLinks += '</div>'
      var formatCls = [
        "gvc_block",
        hasLongLine ? "table_rel" : "table_fix",
      ].join(" ");
      var formatDiv = '<div class="' + formatCls + '">' + fileLinks + out + '</div>'
      var rawDiv = '<div class="gvc_raw">' + pre.innerHTML + '</div>'
      pre.innerHTML = rawDiv + formatDiv
    }
    document.body.classList.add("gvcrendered")
  })()
}