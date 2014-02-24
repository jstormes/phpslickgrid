<?php


/**
 * PHPSlickGrid_ColumnMeta -
 * 
 * This class is for gathering all the meta data related to the columns into 
 * one object.  This class gathers the SQL meta data, the Grid meta data and the
 * roles meta data into one object.
 * 
 * @author jstormes
 *
 */
class PHPSlickGrid_ColumnConfig {

    public $data = array();
    
    public $DbTableClass = null;
    public $PrimaryKeyColumn = null;
    public $TimeStampColumn = null;
    
    public $Columns = array();
    public $Options = array();
    
    public $ProjectIDColumn = false;
    
    public $project_id = null;
    
    public $Plugins = array();
    
    public $CSSFiles = array();
    public $JavascriptFiles = array();
    public $grid_registerPlugin = array();
    
    public $HardHidden = array();
    public $ReadOnly = array();
    
    public $PreRegister = array();
    
    public $MetaTable = null;
    
    public $display_hidden = false;
    
    
    function __construct(PHPSlickGrid_Db_Table_Abstract $DbTable=null, Zend_Db_Table_Abstract $MetaTable=null, $ACL = null, $Current_Cole = null) {  	
    	
    	if ($DbTable!=null) {
            
            // Db Table class that is our model
            $this->DbTableClass = get_class($DbTable);
    
            // Get info on our source table
            $info=$DbTable->info();
            
            // Table Name
            $table_name = $DbTable->getTableName();
    
            // Get primary key aka ID Column
            $this->PrimaryKeyColumn = array_shift($info['primary']);
    
            // Get Time Stamp Column
            foreach($info['metadata'] as $Value) {
                if ($Value['DEFAULT']=='CURRENT_TIMESTAMP') {
                    $this->TimeStampColumn=$Value['COLUMN_NAME'];
                    break;
                }
            }
    
            // Set column from the database table columns.
            foreach($info['cols'] as $DBColumn) {
                $this->Columns[$DBColumn] = new PHPSlickGrid_Column();
    
                // Set the default Slickgrid id for the column = database column name
                $this->Columns[$DBColumn]->id=$DBColumn;
    
                // If this column is the same as the primary key for the table,
                // name the Slickgrid column "#" else the name of the column will match
                // the database column.
                if ($DBColumn==$this->PrimaryKeyColumn) {
                    $this->Columns[$DBColumn]->name="#";
                }
                else {
                	// Default the name to the MySQL column name.
                    $this->Columns[$DBColumn]->name=$DBColumn;
                    $this->Columns[$DBColumn]->editor='PHPSlick.Editors.'.$info['metadata'][$DBColumn]['DATA_TYPE'];
                }
                
                // Set the Slickgrid field to (table_name)$(column_name)
                $this->Columns[$DBColumn]->field=$table_name."$".$DBColumn;
    
                // Default to sortable
                $this->Columns[$DBColumn]->sortable=true;
                
                // Default width to 100 px.
                $this->Columns[$DBColumn]->width=100;
                
                // Save the SQL data type in case it is needed later
                $this->Columns[$DBColumn]->sql_type=$info['metadata'][$DBColumn]['DATA_TYPE'];
    
                // If the database field has a length save it in case it is needed later.
                if ($info['metadata'][$DBColumn]['LENGTH']!='')
                    $this->Columns[$DBColumn]->sql_length=$info['metadata'][$DBColumn]['LENGTH'];
                
            }
        }
    }
    
    /**
     * Convert to JSON.
     *
     * By: jstormes Feb 5, 2014
     *
     * @return string
     */
    public function ToJSON() {
    	$JSON = '[';
    	
    	foreach($this->Columns as $Column)
    		$JSON.=json_encode($Column->data,JSON_FORCE_OBJECT).",\n";
    	
    	// trim the trailing "," off the string.
    	$JSON = rtrim($JSON,",\n");
    	
    	$JSON .= "]";
    	
    	return $JSON;
    }
    
    private function DerefrenceTable($column) {
    	if (strstr($column,'$'))
    		return ltrim(strstr($column,'$'),'$');
    	else
    		return $column;
    }
    
    public function ToJavaScript() {    
    
    	// This is a hack to overcome the fact the PHP is typeless
    	// and the parameters have impled types.
    	$integers = array('width','sql_length');
    	$objects = array('editor','formatter');
    	$booleans = array('sortable','multiColumnSort');
    
    	$dont_quote = array_merge($integers,$objects,$booleans);
    
    	$column="";
    	foreach($this->Columns as $Column) {
    		$db_column=$this->DerefrenceTable($Column->field);
    		// Don't even send hard hidden columns to browser.
    		if (!in_array($db_column, $this->HardHidden)) {
	    		if (!isset($Column->hidden)) {
	    			$line="";
	    			foreach($Column->data as $Key=>$setting) {
	    				if (in_array($Key,$dont_quote))
	    				if (in_array($Key, $booleans))
	    					$line.=$Key.": ".($setting?'true':'false').", ";
	    				else
	    					$line.=$Key.": ".$setting.", ";
	    				else
	    					$line.=$Key.": \"".$setting."\", ";
	    			}
	    			$line="\t{".rtrim($line,', ')."},\n";
	    			$column.=$line;
	    		}
    		}
    	}
    	$column=rtrim($column,",\n");
    
    	$HTML = "[\n{$column}\n];\n";
    	 
    	return $HTML;
    }
    
    
    public function RegisterPlugin(Slickgrid_Plugins_Abstract $Plugin) {
    
        array_push($this->Plugins,$Plugin);
    
        // Add Any Javascript Files to the array of Javascript files to load
        $this->JavascriptFiles=array_merge($this->JavascriptFiles,$Plugin->Javascript_File);
    
        // Add Any CSS Fiels to the array of CSS files to load
        $this->CSSFiles=array_merge($this->CSSFiles,$Plugin->CSS_Files);
    
        // Add Any grid.registerPlugin js objects to the list of
        // grid.registerPlugin to load.
        $this->grid_registerPlugin=array_merge($this->grid_registerPlugin,$Plugin->grid_registerPlugin);
    
        if (method_exists($Plugin, 'Configuration'))
            $Plugin->Configuration($this);
    
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

}