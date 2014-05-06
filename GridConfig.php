<?php
/**
 * In esiance this is the grid and cache "state"
 * 
 * 
 * @author jstormes
 *
 */
class PHPSlickGrid_GridConfig {

    public $data       = array();
    public $conditions = array();
    public $plugins    = array();
    public $staticFields = array(); 
    
    
    function __construct () {
    	
    	// Set some reasonable defaults
    	
    	$this->editable             = true;
    	$this->enableAddRow         = true;
    	$this->enableCellNavigation = true;
    	$this->enableEditorLoading  = false;
    	$this->autoEdit             = true;
    	$this->enableColumnReorder  = true;
    	$this->forceFitColumns      = false;
    	$this->rowHeight            = 22;
    	$this->autoHeight           = false;
    	$this->multiColumnSort      = true;
    	$this->minWidth			 	= 5;
    	$this->editable             = true;
    	
    }

    public function __set($name, $value)
    {
        $this->data[$name] = $value;
    }

    public function __get($name)
    {
        //echo "Getting '$name'\n";
        if (array_key_exists($name, $this->data)) {
            return $this->data[$name];
        }

        $trace = debug_backtrace();
        trigger_error(
        'Undefined property via __get(): ' . $name .
        ' in ' . $trace[0]['file'] .
        ' on line ' . $trace[0]['line'],
        E_USER_NOTICE);
        return null;
    }
     
    public function __isset($name)
    {
        return isset($this->data[$name]);
    }

    public function __unset($name)
    {
        unset($this->data[$name]);
    }
    
    /**
     * Convert to JSON.
     *
     * By: jstormes Feb 5, 2014
     *
     * @return string
     */
    public function ToJSON() {
	    return (json_encode($this->data));
    }
    


}