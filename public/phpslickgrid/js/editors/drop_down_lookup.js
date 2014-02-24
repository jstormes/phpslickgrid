(function ($) {
  // register namespace
  $.extend(true, window, {
    "PHPSlickGrid": {
      "Editors": {
        "DropDown": DropDownEditor
        
      }
    }
  });
  
  function DropDownEditor(args) {
	    var $input;
	    var defaultValue;
	    var scope = this;

	    this.init = function () {
	      $input = $("<select>"+
  "<option value='volvo'>Volvo</option>"+
  "<option value='saab'>Saab</option>" +
  "<option value='mercedes'>Mercedes</option>" +
  "<option value='audi'>Audi</option>"+
"</select> ")
	          .appendTo(args.container)
	          .bind("keydown.nav", function (e) {
	            if (e.keyCode === $.ui.keyCode.LEFT || e.keyCode === $.ui.keyCode.RIGHT) {
	              e.stopImmediatePropagation();
	            }
	          })
	          .focus()
	          .select();
	    };

	    this.destroy = function () {
	      $input.remove();
	    };

	    this.focus = function () {
	      $input.focus();
	    };

	    this.getValue = function () {
	      return $input.val();
	    };

	    this.setValue = function (val) {
	      $input.val(val);
	    };

	    this.loadValue = function (item) {
	      defaultValue = item[args.column.field] || "";
	      $input.val(defaultValue);
	      $input[0].defaultValue = defaultValue;
	      $input.select();
	    };

	    this.serializeValue = function () {
	      return $input.val();
	    };

	    this.applyValue = function (item, state) {
	      item[args.column.field] = state;
	    };

	    this.isValueChanged = function () {
	      return (!($input.val() == "" && defaultValue == null)) && ($input.val() != defaultValue);
	    };

	    this.validate = function () {
	      if (args.column.validator) {
	        var validationResults = args.column.validator($input.val());
	        if (!validationResults.valid) {
	          return validationResults;
	        }
	      }

	      return {
	        valid: true,
	        msg: null
	      };
	    };

	    this.init();
	  }
  
})(jQuery);