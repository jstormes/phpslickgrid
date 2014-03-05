(function ($) {
  // register namespace
  $.extend(true, window, {
    "PHPSlick": {
      "Editors": {
        "HTML": HTML
      }
    }
  });

  /*
   * An example of a "detached" editor.
   * The UI is added onto document BODY and .position(), .show() and .hide() are implemented.
   * KeyDown events are also handled to provide handling for Tab, Shift-Tab, Esc and Ctrl-Enter.
   */
  function HTML(args) {
    var $input, $wrapper;
    var defaultValue;
    var scope = this;
    
    var editor=null;

    this.init = function () {
      var $container = $("body");

      $wrapper = $("<DIV id='testedit' style='z-index:10000;position:absolute;background:white;padding:5px;border:3px solid gray; -moz-border-radius:10px; border-radius:10px;'/>")
          .appendTo($container);

      //$input = $("<TEXTAREA id='html_cell_edit' hidefocus rows=5 style='backround:white;width:500px;height:160px;border:0;outline:0'>")
      //    .appendTo($wrapper);
      $input = $("<DIV id='html_cell_edit' />").appendTo($wrapper);
      var conf = 	{
    		  skin : 'BootstrapCK-Skin',
    		  toolbar : [['Styles','Format','Font','FontSize'],
    		             '/',
    		             ['Bold','Italic','Underline','StrikeThrough','-','Undo','Redo','-','Cut','Copy','Paste','Find','Replace','-','Outdent','Indent','-','Print'],
    		             '/',
    		             ['NumberedList','BulletedList','-','JustifyLeft','JustifyCenter','JustifyRight','JustifyBlock'],
    		             ['Table','-','Link','Smiley','TextColor','BGColor','Source']]
      };
      
      editor = CKEDITOR.appendTo( 'html_cell_edit', conf, '' );

      $("<DIV style='text-align:right'><BUTTON>Save</BUTTON><BUTTON>Cancel</BUTTON></DIV>")
          .appendTo($wrapper);

      $wrapper.find("button:first").bind("click", this.save);
      $wrapper.find("button:last").bind("click", this.cancel);
      //$input.bind("keydown", this.handleKeyDown);

  	  //editor = CKEDITOR.replace( 'html_cell_edit',
  		//	{
  		//	skin : 'BootstrapCK-Skin'
  		//	});
      
      
      scope.position(args.position);
      //$input.focus().select();
    };

    this.handleKeyDown = function (e) {
      if (e.which == $.ui.keyCode.ENTER && e.ctrlKey) {
        scope.save();
      } else if (e.which == $.ui.keyCode.ESCAPE) {
        e.preventDefault();
        scope.cancel();
      } else if (e.which == $.ui.keyCode.TAB && e.shiftKey) {
        e.preventDefault();
        args.grid.navigatePrev();
      } else if (e.which == $.ui.keyCode.TAB) {
        e.preventDefault();
        args.grid.navigateNext();
      }
    };

    this.save = function () {
      args.commitChanges();
      args.grid.resetActiveCell();
    };

    this.cancel = function () {
    	editor.setData(defaultValue);
      //$input.val(defaultValue);
      args.cancelChanges();
    };

    this.hide = function () {
      $wrapper.hide();
    };

    this.show = function () {
      $wrapper.show();
    };

    this.position = function (position) {
      $wrapper
          .css("top", position.top - 5)
          .css("left", position.left - 5)
    };

    this.destroy = function () {
    	editor.destroy();
    	editor=null;
      $wrapper.remove();
    };

    this.focus = function () {
    	editor.focus();
    };

    this.loadValue = function (item) {
    	editor.setData(defaultValue = item[args.column.field]);
      //$input.val(defaultValue = item[args.column.field]);
      //$input.select();
    };

    this.serializeValue = function () {
      //return $input.val();
    	return editor.getData();
    };

    this.applyValue = function (item, state) {
      item[args.column.field] = state;
    };

    this.isValueChanged = function () {
      return (!(editor.getData() == "" && defaultValue == null)) && (editor.getData() != defaultValue);
    };

    this.validate = function () {
      return {
        valid: true,
        msg: null
      };
    };

    this.init();
  }
  
})(jQuery);