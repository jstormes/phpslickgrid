<?php

class PHPSlickGrid_HeaderPlugins_MenuItems_SimpleFilter extends PHPSlickGrid_HeaderPlugins_MenuItems_Abstract
{
	public $columns = null;
	
	public $options = null;
	
	
	public function __construct($options = array()) {
		// Grab a refrence to the logger.
		$this->log              = Zend_Registry::get('log');
		
		$this->options = $options;
	}
	
	public function render($plugin_id, PHPSlickGrid_HeaderPlugins_Abstract $parent, $GridName) {
		
		// Copy the jsonrpc URL from the model.
		$TableOptions = $parent->Table->getGridState();
		$this->options['jsonrpc'] = $TableOptions['jsonrpc'];
		
		$options = json_encode($this->options);
		
		$HTML = "";
		$HTML .= "var {$parent->name}_$plugin_id = new PHPSlickGrid.HeaderPlugins.MenuItems.SimpleFilter({$options},{$GridName},{$GridName}Data);\n\n";
		$HTML .= "{$parent->name}.registerPlugin({$parent->name}_$plugin_id);\n\n";
		
		return $HTML;
	}
	
}
