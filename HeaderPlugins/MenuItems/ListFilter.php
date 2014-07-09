<?php

class PHPSlickGrid_HeaderPlugins_MenuItems_ListFilter extends PHPSlickGrid_HeaderPlugins_MenuItems_Abstract
{
	public $columns = null;
	
	
	public function __construct() {
		
	}
	
	public function render($plugin_id, PHPSlickGrid_HeaderPlugins_Abstract $parent) {
		
		$HTML = "";
		$HTML .= "var {$parent->name}_$plugin_id = new PHPSlickGrid.HeaderPlugins.MenuItems.ListFilter();\n\n";
		$HTML .= "{$parent->name}.registerPlugin({$parent->name}_$plugin_id);\n\n";
		
		return $HTML;
	}
	
}
