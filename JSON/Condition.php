<?php
class PHPSlickGrid_JSON_Condition {

    public $column;
    public $value;
    public $operator;
    public $type;

    public function __construct($column=null,$value=null,$operator='=',$type='and') {
        $this->column=$column;
        $this->value=$value;
        $this->operator=$operator;
        $this->type=$type;
    }
}