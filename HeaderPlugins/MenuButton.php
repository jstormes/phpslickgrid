<?php

class PHPSlickGrid_HeaderPlugins_MenuButton  extends PHPSlickGrid_HeaderPlugins_Abstract
{
	public $icon=null;
	
	public $Columns=null;
	
	public $Plugins= array();
	
	public $name = null;
	
	public $Table = null;
	
	/**
	 * Add a Plugin to this menu
	 * 
	 * @param PHPSlickGrid_HeaderMenu_Plugins_HTML $Plugin
	 */
 	public function AddPlugin(PHPSlickGrid_Plugins_HeaderMenu_Abstract $Plugin){
 		array_push($this->Plugins, $Plugin);
 	}
 	
 	public function AddPluginToColumns($Columns, PHPSlickGrid_Plugins_HeaderMenu_Abstract $Plugin){
 		array_push($this->Plugins, $Plugin);
 	}
	
 	public function Columns($Columns) {
 		$this->Columns=$Columns;
 	}
 	
 	public function render($plugin_id, $Table) {
 		
 		
 		$GridName = $Table->_gridName;
 		$this->Table = $Table;
 		$this->name = "plugin_{$plugin_id}_menu";
 		
 		$options = json_encode(array("icon"=>$this->icon,'columns'=>$this->Columns));
 		
 		$HTML  = "// *******************************************************\n";
		$HTML .= "// Rendering HeaderMenu.\n";
		$HTML .= "// *******************************************************\n";
 		$HTML .= "var {$this->name} = new PHPSlickGrid.HeaderPlugins.MenuButton({$GridName}, {$GridName}Data, {$options});\n\n";
 		
 		$header_plugin_id=1;
 		foreach($this->Plugins as $plugin) {
 			$HTML .= $plugin->render($header_plugin_id++, $this);
 		}
 		
 		$HTML .= "{$GridName}.registerPlugin(plugin_{$plugin_id}_menu);\n\n";
 		return $HTML;
 		
 	}
	
}