<?php

class PHPSlickGrid_Db_Table extends PHPSlickGrid_Db_Table_Abstract2
{
	//protected $_rowClass = 'PHPSlickGrid_Db_Table_Row';
	
	
	/**
	 * getFriendlyName() - Get the Friendly Name for the Users
	 *
	 * By: jstormes Sep 25, 2013
	 *
	 * @return string
	 */
	public function getFriendlyName() {
		return $this->_friendlyName;
	}
	
	private function _getColumnInformation($ColumnName) {
		
		$column = array();
		
		$column['name']="Name";
		
		$column['sql_type']="SQL Type";
		$column['grid_type']="Grid Type";
		
		$column['max_length'] = 0;  // For string types the maximum number of characters.
									// For numeric types the maximum number of integer digits.
		$column['max_decimal'] = 0; // For numeric types the maximum number of digits after the ".".
		
	}
	
	/**
	 * getColumnInformation() - Get information about the columns
	 *
	 * By: jstormes Sep 25, 2013
	 *
	 * @return array
	 */
	public function getColumnInformation() {
		
		$info = array();
		
		
	}
	
	
    /**
     * __construct() - For concrete implementation of Zend_Db_Table
     *
     * @param string|array $config string can reference a Zend_Registry key for a db adapter
     *                             OR it can reference the name of a table
     * @param array|Zend_Db_Table_Definition $definition
     */
    public function __construct($config = array(), $definition = null)
    {
        if ($definition !== null && is_array($definition)) {
            $definition = new Zend_Db_Table_Definition($definition);
        }

        if (is_string($config)) {
            if (Zend_Registry::isRegistered($config)) {
                trigger_error(__CLASS__ . '::' . __METHOD__ . '(\'registryName\') is not valid usage of PHPSlickGrid_Db_Table, '
                    . 'try extending Zend_Db_Table_Abstract in your extending classes.',
                    E_USER_NOTICE
                    );
                $config = array(self::ADAPTER => $config);
            } else {
                // process this as table with or without a definition
                if ($definition instanceof Zend_Db_Table_Definition
                    && $definition->hasTableConfig($config)) {
                    // this will have DEFINITION_CONFIG_NAME & DEFINITION
                    $config = $definition->getTableConfig($config);
                } else {
                    $config = array(self::NAME => $config);
                }
            }
        }

        parent::__construct($config);
    }
    
    /**
     * Fetches rows by primary key.  The argument specifies one or more primary
     * key value(s).  To find multiple rows by primary key, the argument must
     * be an array.
     *
     * This method accepts a variable number of arguments.  If the table has a
     * multi-column primary key, the number of arguments must be the same as
     * the number of columns in the primary key.  To find multiple rows in a
     * table with a multi-column primary key, each argument must be an array
     * with the same number of elements.
     *
     * The find() method always returns a Rowset object, even if only one row
     * was found.
     *
     * @return PHPSlickGrid_Db_Table_Rowset Row(s) matching the criteria.
     * @throws Zend_Db_Table_Exception
     */
    public function find() {
    	$args = func_get_args();
   		return parent::find($args);	
    }
    
    
    /**
     * Fetches all rows.
     *
     * Honors the Zend_Db_Adapter fetch mode.
     *
     * @param string|array|Zend_Db_Table_Select $where  OPTIONAL An SQL WHERE clause or Zend_Db_Table_Select object.
     * @param string|array                      $order  OPTIONAL An SQL ORDER clause.
     * @param int                               $count  OPTIONAL An SQL LIMIT count.
     * @param int                               $offset OPTIONAL An SQL LIMIT offset.
     * @return PHPSlickGrid_Db_Table_Rowset The row results per the Zend_Db_Adapter fetch mode.
     */
    public function fetchAll($where = null, $order = null, $count = null, $offset = null)
    {
    	return parent::fetchAll($where, $order, $count, $offset);
    }
    
    
    /**
     * Fetches one row in an object of type Zend_Db_Table_Row_Abstract,
     * or returns null if no row matches the specified criteria.
     *
     * @param string|array|Zend_Db_Table_Select $where  OPTIONAL An SQL WHERE clause or Zend_Db_Table_Select object.
     * @param string|array                      $order  OPTIONAL An SQL ORDER clause.
     * @param int                               $offset OPTIONAL An SQL OFFSET value.
     * @return PHPSlickGrid_Db_Table_Row|null The row results per the
     *     Zend_Db_Adapter fetch mode, or null if no row found.
     */
    public function fetchRow($where = null, $order = null, $offset = null)
    {
    	return parent::fetchRow($where, $order, $offset);
    }
    
    /**
     * Fetches a new blank row (not from the database).
     *
     * @return PHPSlickGrid_Db_Table_Row_Abstract
     * @deprecated since 0.9.3 - use createRow() instead.
     */
    public function fetchNew()
    {
    	return $this->createRow();
    }
    
    
    /**
     * Fetches a new blank row (not from the database).
     *
     * @param  array $data OPTIONAL data to populate in the new row.
     * @param  string $defaultSource OPTIONAL flag to force default values into new row
     * @return PhpSlcikGrid_Db_Table_Row
     */
    public function createRow(array $data = array(), $defaultSource = null)
    {
    	return parent::createRow($data, $defaultSource);
    }
}

