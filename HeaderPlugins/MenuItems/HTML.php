<?php

class PHPSlickGrid_HeaderPlugins_MenuItem_HTML extends PHPSlickGrid_HeaderPlugins_MenuItems_Abstract
{
	public $columns = null;
	
	
	public function __construct($columns) {
		$this->columns = $columns;
	}
	
	public function render($plugin_id, PHPSlickGrid_HeaderPlugins_Abstract $parent) {
		
		$HTML = "/* HELLO WORLD */\n\n";
		$HTML .= "var {$parent->name}_$plugin_id = new PHPSlickGrid.HeaderMenuPlugins.HTML();\n\n";
		
		return $HTML;
	}
	
}
