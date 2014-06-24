<?php

class PHPSlickGrid_Plugins_HeaderMenu  extends PHPSlickGrid_Plugins_Abstract
{
	public $icon=null;
	
	public $Plugins= array();
	
	/**
	 * Add a Plugin to this menu
	 * 
	 * @param PHPSlickGrid_HeaderMenu_Plugins_HTML $Plugin
	 */
 	public function AddPlugin(PHPSlickGrid_Plugins_HeaderMenu_Abstract $Plugin){
 		array_push($this->Plugins, $Plugin);
 	}
	
 	public function render() {
 		
 		$GridName = $Table->_gridName;
 		$options = json_encode($options);
 		
 		$HTML = "<!-- hello -->\n";
 		$HTML .= "<script>\n\n";
 		$HTML .= "  if ({$GridName}_menus == 'undefined') var {$GridName}_menus=1;\n";
 		$HTML .= "    else {$GridName}_menus++;\n";
 		$HTML .= "	var {$name}_menu = new PHPSlickGrid.HeaderMenu({$GridName}, {$GridName}Data, {$options});\n\n";
 		$HTML .= "</script>\n\n";
 		return $HTML;
 		
 	}
	
}