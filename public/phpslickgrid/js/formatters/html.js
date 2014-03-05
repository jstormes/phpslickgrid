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
    "PHPSlick": {
      "Formatters": {
        "HTML": HTML
      }
    }
  });
  
  function HTML(row, cell, value, columnDef, dataContext) {
	  return value;
	}



})(jQuery);
