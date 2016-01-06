<?php

namespace JStormes\PHPSlickGrid\Models;


class AbstractSlickGridGateway 
{
    /**
     * 
     * @var Zend\Db\TableGateway\TableGateway
     */
    protected $tableGateway=null;

	public function __construct(\Zend\Db\TableGateway $tableGateway=null) {
	    if ($tableGateway!=null)
            $this->tableGateway = $tableGateway;
    }
    
    /**
     * 
     * @return multitype:
     */
    public function getColumns() {
        return array();
    }
    
    public function getTableGateway()
    {
        return $this->tableGateway;
    }
    
    public function setTableGateway($tableGateway)
    {
        $this->tableGateway = $tableGateway;
    }
}