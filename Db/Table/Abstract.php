<?php

/**
 * An interesting select, get row number:
 * 
 * 
select * from (SELECT @row_number:=@row_number+1 AS row_number, grid_id
FROM `grid`
JOIN    (SELECT @row_number := 0) r) as t
where row_number=2


Another interesting select get row number by grid_id:


select * from (SELECT @row_number:=@row_number+1 AS row_number, grid_id,A
FROM `grid`
JOIN    (SELECT @row_number := 0) r
order by A)
as t
where grid_id=64

Could be used with grid.scrollCellIntoView(100,0) to find the active row on resort.

 * @author jstormes
 *
 */

class PHPSlickGrid_Db_Table_Abstract extends Zend_Db_Table_Abstract
{
	/**
	 * Logging Object
	 *
	 * @var Zend_Log
	 */
	protected $log = null;
	
	/**
	 * Grid Name
	 *
	 * @var string
	 */
	public $_gridName = '';
	
	/**
	 * Grid State
	 *
	 * @var array
	 */
	public $state = array();
	
	/**
	 * Column Configuration
	 *
	 * @var array
	 */
	protected $_gridColumns = array();
	
	/**
	 * Table used to store meta data about columns
	 *
	 * @var unknown
	 */
	protected $_metaTable = null;
	
	/* Key columns used by the grid to update "state" */
	
	/**
	 * Primary column
	 *
	 * @var string
	 */
	protected $_primary_col = null;
	
	/**
	 * Column to track row updates
	 *
	 * @var string
	 */
	protected $_upd_dtm_col = null;
	
	/**
	 * Column to track row deletes
	 *
	 * @var string
	 */
	protected $_deleted_col = null;
	
	protected $Hidden = array();
	
	/**
	 * Plugins
	 * 
	 * @var PHPSlickGrid_Plugins_Abstract
	 */
	public $Plugins = array();
	
	
	
	/* Used for local caching, to maintain constant view of data. */
	protected $_Length      = null;
	protected $_TotalLenth  = null;
	protected $_MaxPrimary  = null;
	protected $_MaxDateTime = null;
	
	protected $_info = null;
	
	/**
	 * Call the existing constructor then initialize our PHPSlickGrid
	 * properties.
	 *
	 * By: jstormes Feb 5, 2014
	 *
	 * @param unknown $config
	 */
	public function __construct($config = array())
	{
		// Setup our log, very useful for debugging.
		if (Zend_Registry::isRegistered('log')) {
			$this->log = Zend_Registry::get('log');
		}
		else {
			$this->log = new Zend_Log();
			$writer_firebug = new Zend_Log_Writer_Firebug();
			$this->log->addWriter($writer_firebug);
		}
		
		/* Default the grid name to the table name. */
		if ($this->_gridName=='')
			$this->_gridName = $this->_name;
		
		
		
		parent::__construct();

		// get the schema from the database
		$this->_info = $this->info();
		
		// Set primary column from db schema
		$this->_primary_col = array_shift($this->_primary);

		// If we don't have a time stamp column, try and find one.
		if ($this->_upd_dtm_col==null) {
			$this->_setupMetadata();
			foreach($this->_metadata as $Value) {
				if ($Value['DEFAULT']=='CURRENT_TIMESTAMP') {
					//$this->_gridConfig->upd_dtm_col=$this->_gridName."$".$Value['COLUMN_NAME'];
					$this->_upd_dtm_col = $Value['COLUMN_NAME'];
					break;
				}
			}
		}
		
		/* Initialize the grid configuration. */
		$this->_gridState['gridName'] = $this->_gridName;
		$this->_gridState['tableName'] = $this->_name;
		
		/* Get control columns */
		$this->_gridState['primay_col'] = $this->_gridName."$".$this->_primary_col;
		$this->_gridState['upd_dtm_col'] = $this->_gridName."$".$this->_upd_dtm_col;
		$this->_gridState['deleted_col'] = $this->_gridName."$".$this->_deleted_col;
		
		// Hook into grid init.
		$this->_gridInit();
				
	}
	
	protected function _gridInit() {
	
	}
	
	public function initState() {
			
		
		/* Set initial state */
		$this->_gridState['gridLength']       = $this->getLength();      // filtered row count
		$this->_gridState['sortedLength']     = $this->getLength();      // filtered row count
		$this->_gridState['totalRows']        = $this->getTotalLenth();  // un-filtered row count
		$this->_gridState['sortedMaxPrimary'] = $this->getMaxPrimary();  // filtered max primary key
		$this->_gridState['maxDateTime']      = $this->getMaxDateTime(); // filtered max date time
		
		
		/* Set some defaults */
		$this->_gridState['editable']             = true;
		$this->_gridState['enableAddRow']         = true;
		$this->_gridState['enableCellNavigation'] = true;
		$this->_gridState['enableEditorLoading']  = false;
		$this->_gridState['autoEdit']             = true;
		$this->_gridState['enableColumnReorder']  = true;
		$this->_gridState['forceFitColumns']      = false;
		$this->_gridState['rowHeight']            = 22;
		$this->_gridState['autoHeight']           = false;
		$this->_gridState['multiColumnSort']      = true;
		$this->_gridState['minWidth']			  = 5;
		
		$this->_initState();
	}
	
	protected function _initState() {
		
	}
	
	/*
	 * // Build core select
				$select = $this->buildSelect($state);
				$select = $this->addConditionsToSelect($select);
	
				// set limits
				$select->where($this->_primary_col."<= ?", $state['sortedMaxPrimary']);
				$select->limit($length,$start);
	 */
	
	/************************************************/
	/******** begin support for list filter *********/
	/************************************************/
	public function getDistinctLength($column, $options) {
		
		$Results = 0;
		
		$sel=$this->select();
		$this->addConditionsToSelect($sel);
		//$this->addFiltersToSelect($sel, $options['where_list']);
		//if (!empty($options['quicksearch']))
		//	$sel->where("$column LIKE ?",'%'.$options['quicksearch'].'%');
		$sel->from($this->_info['name'], array("count(distinct `$column`) as value"));
		
		$rows=$this->fetchAll($sel)->current();
		if ($rows)
			$Results = $rows->value;
		
		return $Results;
	}
	

	public function getBlockDistinct($start, $length, $column, $state) {
		$Results = array();
		
		$sel=$this->select();
		$this->addConditionsToSelect($sel);
		//$this->addFiltersToSelect($sel, $options['where_list']);
		//if (!empty($options['quicksearch']))
		//	$sel->where("$column LIKE ?",'%'.$options['quicksearch'].'%');
			$sel->from($this->_info['name'], array("{$column} as value"));
		$sel->distinct();
		$sel->limit($length,$start);
		
		$sel->order(array($column));
			
		$rows=$this->fetchAll($sel);
		$this->log->debug($rows[0]->toArray());
		if ($rows)
			$Results = $rows->toArray();
		
		return $Results;
	}
	/************************************************/
	/********** end support for list filter *********/
	/************************************************/
	
	
	public function LookupRowFromKey($key, $state=null) {
		
		// Get basic select
		$select = $this->buildSelect($state, true);
		$select = $this->addConditionsToSelect($select);
		
		// Build our order by
		foreach($state['order_list'] as $orderby) {
			$select->order($orderby);
		}
		
		$count_select = $this->select();
		$count_select->setIntegrityCheck(false);
		
		// Nest our basic select inside a select
		$count_select->from(new Zend_Db_Expr("(".$select.")"), "*");
		
		// Look for the Key
		$count_select->where("{$this->_gridState['primay_col']} = ?",$key);
		
		$row = $this->fetchRow($count_select);
		if ($row != null)
			return $row['row_number'];
		else
			return null;
	}
	
	/**
	 * 
	 * @param array $state
	 * @throws Exception
	 * @return array
	 */
	public function resetState($state) {
		try
		{
			$state['gridLength']       = $this->getLength($state);      // filtered row count
			$state['sortedLength']     = $this->getLength($state);      // filtered row count
			$state['totalRows']        = $this->getTotalLenth($state);  // un-filtered row count
			$state['sortedMaxPrimary'] = $this->getMaxPrimary($state);  // filtered max primary key
			$state['maxDateTime']      = $this->getMaxDateTime($state); // filtered max date time
			
			// Lookup row from column
			if ($state['localStorage']['activeRow']['key']!=null)
				$state['localStorage']['activeRow']['row']=$this->LookupRowFromKey($state['localStorage']['activeRow']['key'],$state);

			return $state;
		}
		catch (Exception $ex) { // push the exception code into JSON range.
			throw new Exception($ex, 32001);
		}
	}
	

	public function getGridState() {
		return $this->_gridState;
	}
	
	public function StateToJSON() {
		
		$this->initState();
		
		return (json_encode($this->_gridState));
	}
	
	public function initColumns() {
		/* Initialize the column configuration. */
		$this->buildGridColumnsFromDBSchema();
		
		$this->_initColumns();
	}
	
	protected function _initColumns() {
		
	}
	
	/**
	 * Convert Column configuration to JavaScript (Not JSON!).
	 * 
	 * @return string
	 */
	public function ColumnsToJavaScript() {
	
		$this->initColumns();
		
		// This is a hack to overcome the fact the PHP is typeless
		// and the parameters have impled types.
		$integers = array('width','sql_length');
		$objects = array('editor','formatter');
		$booleans = array('sortable','multiColumnSort');
	
		$dont_quote = array_merge($integers,$objects,$booleans);
		 
		$column="";
		foreach($this->_gridColumns as $Column) {
			//$db_column=$this->DerefrenceTable($Column->field);
			// Don't setup hidden columns.
			if (!in_array($Column['id'], $this->Hidden)) {
				if (!$Column['hidden']) {
					$line="";
					foreach($Column as $Key=>$setting) {
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
	
	public function buildGridColumnsFromDBSchema() {
		
		// Get info on source table
		$info=$this->info();
		
		// Set column from the database table columns.
		foreach($info['cols'] as $DBColumn) {
			
			$newColumn = array();
		
			// Set the default Slickgrid id for the column = database column name
			$newColumn['id']=$DBColumn;
		
			// If this column is the same as the primary key for the table,
			// name the Slickgrid column "#" else the name of the column will match
			// the database column.
			if ($DBColumn==$this->_primary_col) {
				$newColumn['name']="#";
			}
			else {
				// Default the name to the MySQL column name.
				$newColumn['name']=$DBColumn;
				$newColumn['editor']='PHPSlick.Editors.'.$info['metadata'][$DBColumn]['DATA_TYPE'];
			}
		
			// Set the Slickgrid field to (table_name)$(column_name)
			$newColumn['field']=$this->_name."$".$DBColumn;
		
			// Default to sortable
			$newColumn['sortable']=true;
			
			// Default to not hidden
			$newColumn['hidden']=false;
		
			// Default width to 100 px.
			$newColumn['width']=100;
		
			// Save the SQL data type in case it is needed later
			$newColumn['sql_type']=$info['metadata'][$DBColumn]['DATA_TYPE'];
		
			// If the database field has a length save it in case it is needed later.
			if ($info['metadata'][$DBColumn]['LENGTH']!='')
				$newColumn['sql_length']=$info['metadata'][$DBColumn]['LENGTH'];
			
			$this->_gridColumns[$DBColumn] = $newColumn;
		}
		
	}
	
	public function getMaxPrimary($state=null) {
		
		try
		{
			if ($this->_MaxPrimary===null) {	
				$this->_MaxPrimary=0;
				// Get maximum primary key
				$select = $this->buildSelect($state);
				$select = $this->addConditionsToSelect($select);
					
				// Apply user filters
				//$select = $this->addFilters($select, $state);
					
				$count_select = $this->select();
				$count_select->setIntegrityCheck(false);
				$count_select->from(new Zend_Db_Expr("(".$select.")"), "MAX({$this->_gridState['primay_col']}) as num");
				$row = $this->fetchRow($count_select);
				if ($row->num!==null)
					$this->_MaxPrimary=$row->num;
				else
					$this->_MaxPrimary=0;
			}
			return $this->_MaxPrimary;
		}
		catch (Exception $ex) { // push the exception code into JSON range.
			throw new Exception($ex, 32001);
		}
	}
	
	public function getMaxDateTime($state=null) {
		try
		{
			if ($this->_MaxDateTime==null) {
				// Get max date time
				$select = $this->buildSelect($state);
				$select = $this->addConditionsToSelect($select);
					
				// Apply user filters
				//$select = $this->addFilters($select, $state);
					
				$count_select = $this->select();
				$count_select->setIntegrityCheck(false);
				$count_select->from(new Zend_Db_Expr("(".$select.")"), "MAX({$this->_gridState['upd_dtm_col']}) as num");
				$row = $this->fetchRow($count_select);
				
				$this->_MaxDateTime=$row->num;
			}
			return $this->_MaxDateTime;
		}
		catch (Exception $ex) { // push the exception code into JSON range.
			throw new Exception($ex, 32001);
		}
	}
	
	public function getTotalLenth($state=null) {
		try
		{
			if ($this->_TotalLenth===null) {
				// Get total possible rows
				$select = $this->buildSelect($state);
				$select = $this->addConditionsToSelect($select);
				$count_select = $this->select();
				$count_select->setIntegrityCheck(false);
				$count_select->from(new Zend_Db_Expr("(".$select.")"), 'COUNT(*) as num');
				$row = $this->fetchRow($count_select);
				
				$this->_TotalLenth = $row->num;
			}
			return $this->_TotalLenth;
		}
		catch (Exception $ex) { // push the exception code into JSON range.
			throw new Exception($ex, 32001);
		}
	}
	
	public function getLength($state=null) {
	
		try
		{
			if ($this->_Length===null) {	
				// Get row count for grid
				$select = $this->buildSelect($state);
				$select = $this->addConditionsToSelect($select);
		
				// Apply user filters
				//$select = $this->addFilters($select, $state);
		
				$count_select = $this->select();
				$count_select->setIntegrityCheck(false);
				$count_select->from(new Zend_Db_Expr("(".$select.")"), 'COUNT(*) as num');
				$row = $this->fetchRow($count_select);
				$this->_Length = $row->num;
			}
			return $this->_Length;
		}
		catch (Exception $ex) { // push the exception code into JSON range.
			throw new Exception($ex, 32001);
		}
	}
	


	
	public function buildSelect($state=null, $rowNumbers=false) {
	
		// Make column aliases - "(table name).(column name) as (table name)$(column name)"
		$column = array();
		
		// Add artificial row number
		if ($rowNumbers)
			$columns['row_number']="(@row_number:=@row_number+1)";
		
		foreach($this->_info['cols'] as $key=>$value) {
			$columns[$this->_info['name']."$".$value]=$this->_info['name'].".".$value;
		}
	
		$select = $this->select();
		$select->setIntegrityCheck(false);
		$select->from(array($this->_info['name'] => $this->_info['name']),$columns);
	
		// Initialize the artificial row number
		if ($rowNumbers)
			$select->join(array('r' => new Zend_Db_Expr('(SELECT @row_number := -1)')),'');

	
		return $select;
	}
	
	
	public function addConditionsToSelect(Zend_Db_Select $select) {
		return $select;
	}
	
	
	/**
	 * Returns a contiguous block of records based on the current
	 * sort, sortedLength and sortedMaxPrimary state properties.
	 *
	 * Rows created before the last sort will be less than sortedLength
	 * and will be returned in sorted order, sorted by order_list.
	 *
	 * Rows created after the last sort will be greater than the
	 * sortedMaxPrimary and will be returned in primary key
	 * order.
	 *
	 * By: jstormes May 12, 2014
	 *
	 * @param integer $start Row number to start with
	 * @param integer $length Number of rows to return
	 * @param multitype $state State of the grid view
	 * @throws Exception
	 * @return multitype: Array of items (rows)
	 */
	public function getBlock($start, $length, $state) {
		try
		{

			$Results=array();
				
			if ($start <= $state['sortedLength']) {

				// Build core select
				$select = $this->buildSelect($state);
				$select = $this->addConditionsToSelect($select);
	
				// set limits
				$select->where($this->_primary_col."<= ?", $state['sortedMaxPrimary']);
				$select->limit($length,$start);
	
				// Build our order by
				foreach($state['order_list'] as $orderby) {
					$select->order($orderby);
				}
				
				// Get rows
				$Results = $this->fetchAll($select)->toArray();
	
				// If we get less than a full block
				// see if we have any unsorted rows to pad out
				// the block.
				if (count($Results)<$length) {
	
					$select = $this->buildSelect($state);
					$select = $this->addConditionsToSelect($select);
						
					$select->where($this->_primary_col."> ?", $state['sortedMaxPrimary']);
					$select->limit($length-count($Results),0);
	
					// Order by primary
					$select->order(array($this->_primary_col));
	
					$UnsortedResults = $this->fetchAll($select)->toArray();
	
					
					foreach($UnsortedResults as $row)
						array_push($Results, $row);
				}
			}
			else {
				// Get unsorted block
				$select = $this->buildSelect($state);
				$select = $this->addConditionsToSelect($select);
	
				$select->where($this->_primary_col."> ?", $state['sortedMaxPrimary']);
				$select->limit($length,$start-$state['sortedLength']);
					
				// Order by primary
				$select->order(array($this->_primary_col));
					
				$Results = $this->fetchAll($select)->toArray();
			}
				
			return ($Results);
		}
		catch (Exception $ex) { // push the exception code into JSON range.
			throw new Exception($ex, 32001);
		}
	}
	
	
	
	public function SyncDataCache($state) {

		$ret = array();
		
		$ret['gridLength'] 	= $this->getLength();      // filtered row count
		$ret['totalRows']  	= $this->getTotalLenth();  // un-filtered row count
		$ret['UpdatedRows']	= array();
		$ret['outOfScope']	= array();
		
		$select = $this->buildSelect($state);
		$select = $this->addConditionsToSelect($select);
		
		$select->where("{$this->_primary_col} IN(?)", $state['activeKeys']);
		//$select->where("{$this->_upd_dtm_col} > ?",$state['maxDateTime']);
		
		$rows = $this->fetchAll($select)->toArray();
		
		$inScope=array();
		foreach($rows as $row) {
			if ($row[$this->_gridName."$".$this->_upd_dtm_col]>$state['maxDateTime'])
				$ret['UpdatedRows'][]=$row;
			$inScope[] = $row[$this->_gridName."$".$this->_primary_col];
		}

		// Find rows that have fallen out of scope.
		$ret['outOfScope'] = array_diff($state['activeKeys'], $inScope);
		
		// True up length for rows in the buffer but should not be.
		$ret['gridLength'] += count($ret['outOfScope']);
		
		return $ret;
	}
	
	private function AddTableRefrence($row) {
	
		$info=$this->info();
		$Row = array();
	
		foreach($row as $Key=>$Value) {
			$Key = str_replace($info['name']."$", "", $Key);
			$Row[$info['name']."$".$Key]=$Value;
		}
	
		return $Row;
	}
	
	private function RemoveTableRefrence($row) {
	
		$info=$this->info();
		$Row = array();
	
		foreach($row as $Key=>$Value) {
			$Key = str_replace($info['name']."$", "", $Key);
			$Row[$Key]=$Value;
		}
	
		return $Row;
	}
	
	public function _updateItem($row, $state) {
		return $row;
	}
	
	/**
	 * update an existing row
	 *
	 * @param  array $row
	 * @param  array $options
	 * @return array
	 */
	public function updateItem($row, $state=null) {
	
		try {
			// Remove any tables references from column names.
			$row = $this->RemoveTableRefrence($row);
				
			if ($this->_upd_dtm_col !== null)
				$row[$this->_upd_dtm_col]=null;
				
			// Perform any updateItem logic
			$row = $this->_updateItem($row, $state);
			if ($row===null) return null;  // if null update logic short circuited update.
				
			// Find the exiting Row in the database to update
			$Row=$this->find($row[$this->_primary[1]])->current();
				
			// Copy values from the array to the existing row object.
			foreach($row as $Key=>$Value) {
				if (isset($Row[$Key])) {
					if ($Value=='null') $Value=null;
					$Row[$Key]=$Value;
				}
			}
	
			$Row->save();
			
			// return any rows updated from the last time this was called.
			return $this->SyncDataCache($state);
		}
		catch (Exception $ex) {
			throw new Exception(print_r($ex,true), 32001);
		}
	
	}
	
	public function _addItem($row,$state) {
		return $row;
	}
	
	/**
	 * add a new row
	 *
	 * @param  array $row
	 * @param  array $options
	 * @return null
	 */
	public function addItem($row,$state=null) {
	
		try {
			// Remove any tables references from column names.
			$row=$this->RemoveTableRefrence($row);
				
			// Perform any custom addItem logic
			$row=$this->_addItem($row,$state);
			if ($row===null) return null;  	// if custom add logic returns null,
			// it handled the add.
	
			// Create the new row object
			$NewRow=$this->createRow();
	
			// Copy values from the array to the new row object.
			foreach($row as $Key=>$Value) {
				if (isset($NewRow[$Key])) {
					if ($Value=='null') $Value=null;
					$NewRow[$Key]=$Value;
				}
			}
				
			// Save the new row.
			$NewRow->save();

			// Pass the new row array back to javascript.
			return $this->AddTableRefrence($NewRow->toArray());
		}
		catch (Exception $ex) {
			throw new Exception(print_r($ex,true), 32001);
		}
	
	}
	
	
	public function _deleteItem($row,$options) {
		return $row;
	}
	
	/**
	 * delete an existing row
	 *
	 * @param  array $row
	 * @param  array $options
	 * @return null
	 */
	public function deleteItem($row, $state=null) {
		//sleep(5); // Simulate a slow reply
		try {
			// Remove any tables references from column names.
			$row = $this->RemoveTableRefrence($row);
				
			// Perform any custom deleteItem logic
			$row=$this->_deleteItem($row,$state);
			if ($row===null) return null;  	// if custom delete logic returns null,
			// it handled the delete.
				
			// Find the exiting Row in the database to update
			$Row=$this->find($row[$this->_primary[1]])->current();
			$Row->delete();
	
			return $this->SyncDataCache($state);
		}
		catch (Exception $ex) {
			throw new Exception(print_r($ex,true), 32001);
		}
	
	}
	
	/**
	 * Add Plugin Logic to grid
	 * 
	 * @param PHPSlickGrid_Plugins_Abstract $Plugin
	 */
	public function AddPlugin(PHPSlickGrid_HeaderPlugins_Abstract $Plugin) {
		array_push($this->Plugins, $Plugin);
	}
	
}