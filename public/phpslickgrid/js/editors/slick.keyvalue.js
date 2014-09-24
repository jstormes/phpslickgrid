/***
 * Contains a basic PHPSlickGrid formatters.
 * 
 * 
 * @module Formatters
 * @namespace PHPSlick
 */

(function ($) {
  // register namespace
  $.extend(true, window, {
    "Slick": {
      "Formatters": {
        "KeyValue": KeyValue
      }
    }
  });
  
  function KeyValue(row, cell, value, columnDef, dataContext) {
	  //console.log("drop down");
	  //console.log(columnDef.values);
	  if (typeof(columnDef.values[value])!='undefined')
		  return columnDef.values[value];
	  else 
		  return columnDef.values[value];
  }

})(jQuery);


/***
 * Contains select SlickGrid editors.
 * @module Editors
 * @namespace PHPSlick
 */

(function ($) {
  // register namespace
  $.extend(true, window, {
    "Slick": {
      "Editors": {
        "KeyValue": KeyValue
      }
    }
  });
  
  function KeyValue(args) {
	        var select=null;
	        var defaultValue=null;
	        var scope = this;
	        var select=null;
	        //var opts = [];
	        
	        this.init = function() {

	        	TimeLock=true;   
	        	//console.log(args);

	        	// get Column name
	        	var Column = args['column']['field'];
	        	var Item = args['item'];
	        	//log("Item "+Item);
	        	// Get item.
	        	
	        	var service = new jQuery.Zend.jsonrpc({url: args['column']['jsonrpc'], async:false, 
				    'error': function(data) {alert(data);},
	    		    'exceptionHandler': function(data) {alert(data);} });    // Simple error and exception handlers
	        	
	            // Call the JSON call for the list of options.
	        	//var reply = service.getOptions(Column, Item);         // Ask server for data
	           //var reply = {'1':'test','2':'test2'};
	           var reply = args.column.values;
	           
	           //console.log(args.column.values);
	           
	            var option_str="";
	            for(i in args.column.values) {
	                //console.log(args.column.values[i]);
	            	
	            	if (args.column.values[i]==args.item[args.column.field])
	            		option_str += "<OPTION value='"+i+"' selected ='selected'>"+args.column.values[i]+"</OPTION>";
	            	else
	            		option_str += "<OPTION value='"+i+"'>"+args.column.values[i]+"</OPTION>";
	            		
	            }

	            // Build the select
	            select = $("<SELECT tabIndex='0' class='editor-select'>"+ option_str +"</SELECT>");
	            //$select = $("<SELECT class='editor-select'>"+ option_str +"</SELECT>");
	            select.bind("keydown.nav", function (e) {
	                if (e.keyCode === $.ui.keyCode.LEFT || e.keyCode === $.ui.keyCode.RIGHT
	                		|| e.keyCode === $.ui.keyCode.UP || e.keyCode === $.ui.keyCode.DOWN) {
	                  e.stopImmediatePropagation();
	                }
	              });
	            select.appendTo(args.container);
	            select.focus();

	            TimeLock=false;   
	        };

	        this.destroy = function() {
	            select.remove();
	        };

	        this.focus = function() {
	            select.focus();
	        };

	        this.loadValue = function(item) {
	            defaultValue = item[args.column.field];
	            select.val(defaultValue);
	        };

	        this.serializeValue = function() {
	            return select.val();
	        };

	        this.applyValue = function(item,state) {
	            item[args.column.field] = state;
	        };

	        this.isValueChanged = function() {
	        	var selectedValue = select.val();
	        	if (selectedValue=='null')
	        		selectedValue=null;
	        	//console.log(selectedValue+' != '+defaultValue);
	            return (selectedValue != defaultValue);
	        };

	        this.validate = function() {
	            return {
	                valid: true,
	                msg: null
	            };
	        };

	        this.init();
	    }

})(jQuery);
