/* https://github.com/RichardSquires/summernote-link-editor
* Version: 1.0.0
*/
(function (factory) {
   if (typeof define === 'function' && define.amd) {
       define(['jquery'], factory);
   } else if (typeof module === 'object' && module.exports) {
       module.exports = factory(require('jquery'));
   } else {
       factory(window.jQuery);
   }
}(function ($) {
   $.extend(true, $.summernote.lang, {
       'zh-CN': {
           CodeMirror: {
               codeType: "请选择代码语言",
               code:"插入代码段",
               edit:"编辑代码",
               body: "",
               foot: "保存"
           }
       }
   });
   $.extend($.summernote.options, {
      CodeMirror: {
        asp           : ["ASP", "vbscript"],
        actionscript  : ["ActionScript(3.0)/Flash/Flex", "clike"],
        bash          : ["Bash/Bat/Shell", "shell"],
        css           : ["CSS/SASS/SCSS/LESS", "css"],
        c             : ["C/C++/C#", "clike"],
        html          : ["HTML", "text/html"],
        java          : ["Java/Scala/Swift", "clike"],
        javascript    : ["Javascript", "javascript"],
        lua           : ["Lua", "text/x-lua"],
        markdown      : ["Markdown", "text/x-markdown"],
        nginx         : ["Nginx","text/x-nginx-conf"],
        perl          : ["Perl", "text/x-perl"],
        python        : ["Python/Cython", "python"],
        sql           : ["SQL", "sql"],
        tornado       : ["Tornado", "text/x-tornado"],
        vue           : ["Vue", "text/x-vue"],
        xml           : ["XML", "text/xml"],
        yaml          : ["YAML", "text/x-yaml"]
    },
    addonOptions: {
        lineNumbers: true,
        autofocus: true,
        foldGutter: true,
        smartIndent: true,
        matchBrackets: true,
        indentWithTabs: true,
        autoCloseTags: true,
        styleSelectedText: true,
        autoCloseBrackets: true,
        showTrailingSpace: true,
        highlightSelectionMatches: true,
        indentUnit:2,
        tableSize:2,
        line: true,
        lineWrapping: true
      }
    
   });
   $.extend($.summernote.plugins, {
       'CodeMirror': function (context) {
           CodeMirror.modeURL = "/codemirror/mode/%N/%N.js";
           var codeId=320001;
           var self = this,
               ui = $.summernote.ui,
               $note = context.layoutInfo.note,
               $editor = context.layoutInfo.editor,
               $editable = context.layoutInfo.editable,
               options = context.options,
               lang = options.langInfo;
           /*override keyboard mapping for links*/
           if(shouldInitialize()) {
               options.keyMap.pc['CTRL+K'] = 'CodeMirror.show';
               options.keyMap.mac['CMD+K'] = 'CodeMirror.show';
           }
           var codeEdit;
           context.memo('button.codeLink', function () {
            var button = ui.button({
                contents: ui.icon(options.icons.code),
                container: context.layoutInfo.editor[0],/*fix to allow tooltip to show*/
                tooltip: lang.CodeMirror.code,
                click: function () {
                    context.invoke('CodeMirror.show');
                }
            });
            return button.render();
            });

           this.initialize = function () {
               /*create dialog*/
               var $container = options.dialogsInBody ? $(document.body) : $editor;
               /*header*/
               var header = 
               /*dialog nav*/
               '<div class="note-header">' +
               "<select><option selected=\"selected\" value=\"\">" + lang.CodeMirror.codeType + "</option></select>"
               +'</div>';
               var body = '<div class="mirrorBody"><textarea class="note-link-body"></textarea></div>';
               /*footer button*/
               var footerButton = '<button href="#" class="btn btn-primary note-btn note-btn-primary note-advLink-btn" disabled>' + lang.CodeMirror.foot + '</button>';
               /*dialog*/
               this.$dialog = ui.dialog({
                   className: 'adv-link-dialog',
                   title: lang.CodeMirror.code,
                   body: header + body,
                   footer: footerButton,
                   callback: function($dialog) {
                       /*generate email link on the fly */
                       var $codeType = $dialog.find('select');
                       if ($codeType.find("option").length === 1) {
                           for (var key in options.CodeMirror)
                           {
                               var codeLang = options.CodeMirror[key];
                               $codeType.append("<option value=\"" + codeLang[1] + "\" mode=\"" + codeLang[1] + "\">" + codeLang[0] + "</option>");
                           }
                       }
                       $codeType.one('click',function(){
//                            codeEdit = CodeMirror.fromTextArea($body[0],options.addonOptions);
                            checkFormValid();
                       })
                       $codeType.on('change',function(){
                            getLang()
                            checkFormValid();
                       })

                      /*bind url to title inputs and enable/disable save button*/
                       var checkFormValid = function() {
                        var isDisabled = $codeType.val().length === 0
                        $dialog.find('.note-btn.note-advLink-btn').prop('disabled', isDisabled)
                       }
                       var getLang=function(){
                        var lang = $codeType.val(),mode;
                        var info = CodeMirror.findModeByMIME(lang);
                            if (info){
                                mode = info.mode;
                            }else{
                                mode=lang;
                            }
                         codeEdit.setOption("mode", mode);
                         CodeMirror.autoLoadMode(codeEdit, mode);
                       }
                   }
               }).render().appendTo($container);
               
           };
           this.destroy = function () {
               ui.hideDialog(this.$dialog);
               this.$dialog.remove();
           };
           this.bindEnterKey = function ($input, $btn) {
               $input.on('keypress', function (e) {
                   if (e.keyCode === 13) $btn.trigger('click');
               });
           };
           this.show = function () {
               var codeInfo = {
                   rng:context.invoke('editor.getLastRange'),
                   id:codeId,
                   html:''
               }
               context.invoke('editor.saveRange');
               var $codenode = $('<form id=f'+codeInfo.id+"></form>");
               ui.showDialog(self.$dialog);           
               this.showImageAttributesDialog(codeInfo).then(function(codeInfo){
                ui.hideDialog(self.$dialog);
                context.invoke('editor.restoreRange');
                if(codeInfo){
                    var ht=codeInfo.html
                    var node = $codenode.html(ht)[0];
                    $note.summernote('insertNode', node);
                }  
                context.invoke('editor.saveRange');       
               }).then(function () {
                $note.summernote('restoreRange');
              });
             
           };
           this.showImageAttributesDialog = function(codeInfo) {
            return $.Deferred(function (deferred) {
                var $editBtn = self.$dialog.find('.note-advLink-btn'),
                    $type = self.$dialog.find('select'),
                    $body = self.$dialog.find('.mirrorBody');
                /*dialog ui functions*/
                ui.onDialogShown(self.$dialog, function () {
                    codeId +=1;
                    context.triggerEvent('dialog.shown');
                    $editBtn.off();
                    $editBtn.one('click', function (e) {
                        e.preventDefault();
                        deferred.resolve(
                            {
                                rng:codeInfo.rng,
                                id:codeInfo.id,
                                html:$body.children()
                            }
                        ).then(function (codeInfo) {
                            /*synch changes*/
                            context.triggerEvent('change', $editable.html());
                        });
                    });
                    if ($type.val()!=lang.CodeMirror.codeType){
                        $body.html('<textarea id='+codeId+'></textarea>');
                    }else{
                        $body.attr('<div class="mirrorBody"><textarea class="note-link-body"></textarea></div>');
                    }
                      $type.val("");
//                    $body.html('<textarea id='+codeId+'></textarea>');
                    codeEdit = CodeMirror.fromTextArea($('#'+codeId)[0],options.addonOptions);
 //                   $body.html('<textarea class="note-link-body"></textarea>');
                      self.bindEnterKey($editBtn);
            })
            ui.onDialogHidden(self.$dialog, function () {
                $editBtn.off('click');
                if (deferred.state() === 'pending') deferred.reject();
            });
            ui.showDialog(self.$dialog);
        })
        }
           //events for this plugin
           this.events = {
           }
           /*check we have enough tabs to be useful*/
           function shouldInitialize() {
               return options.CodeMirror;
           }
           this.shouldInitialize = shouldInitialize;
       }
   });
}))