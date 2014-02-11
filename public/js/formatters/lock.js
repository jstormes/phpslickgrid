/***
 * Contains basic SlickGrid formatters.
 * 
 * NOTE:  These are merely examples.  You will most likely need to implement something more
 *        robust/extensible/localizable/etc. for your use!
 * 
 * @module Formatters
 * @namespace Slick
 */

(function ($) {
  // register namespace
  $.extend(true, window, {
    "PHPSlickGrid": {
      "Formatters": {
        "Lock": LockFormatter
      }
    }
  });

  
  function LockFormatter(row, cell, value, columnDef, dataContext) {	 
	 // console.log("LockFormatter");
	  //console.log(value);
	  if (value>=1)
		  return "<span style='text-align:center'><i class='fa fa-lock'></i></span>";
	  else
		  return "<span style='text-align:center'><i class='fa fa-unlock'></i></span>";
 }

  
})(jQuery);
