<?php

class PHPSlickGrid_HeaderPlugins_MenuItems_HTML extends PHPSlickGrid_HeaderPlugins_MenuItems_Abstract
{
	public $columns = null;
	
	public $HTML = null;
	
	
	public function __construct($HTML) {
		$this->HTML = $HTML;
	}
	
	public function render($plugin_id, PHPSlickGrid_HeaderPlugins_Abstract $parent) {
		
		$html = json_encode($this->HTML);
		
		$HTML = "";
		$HTML .= "var {$parent->name}_$plugin_id = new PHPSlickGrid.HeaderPlugins.MenuItems.HTML();\n\n";
		$HTML .= "{$parent->name}_$plugin_id.setHTML({$html});\n\n";
		$HTML .= "{$parent->name}.registerPlugin({$parent->name}_$plugin_id);\n\n";
		
		return $HTML;
	}
	
}
