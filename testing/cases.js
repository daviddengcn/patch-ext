/*
 Including issue #3
*/
test("parseLine basic", function() {
  var ctx = {}
  var type_lines = [
    'line', 'From 4359e3b3e0d40a089430ccf94e8411ba0cc4fa77 Mon Sep 17 00:00:00 2001',
    'subject', 'Subject: [PATCH] DRILL-1612: Add maven enforcer rules for maven and Java',
    'line', ' version',
    'line', '',
    'line', '* Allows compilation with JDK version 1.7.x and maven 3.x only',
    'line', '+ Updated maven-enforcer-plugin to 1.3.1.',
    'line', '---',
    'line', ' pom.xml | 20 +++++++++++++++++++-',
    'line', ' 1 file changed, 19 insertions(+), 1 deletion(-)',
    'line', '',
    'filestart', 'diff --git a/pom.xml b/pom.xml',
    'line', 'index 28343bd..d136222 100644',
    'minusfile', '--- a/pom.xml',
    'plusfile', '+++ b/pom.xml',
    'lineinfo', '@@ -265,6 +265,24 @@',
    'lineinfo', '@@ -0,0 +1 @@',
    'lineinfo', '@@ -1 +0,0 @@',
    'sameline', '         <artifactId>maven-enforcer-plugin</artifactId>',
    'plusline', '+            <id>validate_java_and_maven_version</id>',
    'minusline', '-          <version>1.2</version>',
    'sameline', '         </plugin>',
  ]
  var types = [
  ]
  for (var j = 0; j < type_lines.length; j += 2) {
    var tp = type_lines[j]
    var line = type_lines[j + 1]
    var info = g_parseLine(line, ctx)
    equal(info.tp, tp, 'line ' + (j/2 + 1) + ': ' + line);
    if (info.tp == 'filestart') {
      ctx = {}
      continue
    }
    if (info.tp == 'lineinfo') {
      ctx.ready = true
      continue
    }
  }
});
