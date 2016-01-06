<?php


namespace JStormes\PHPSlickGrid\Models\Traits;

trait ColumnsTraits
{
    /**
     *   var columns = [
    {id: "title", name: "Title", field: "title"},
    {id: "duration", name: "Duration", field: "duration"},
    {id: "%", name: "% Complete", field: "percentComplete"},
    {id: "start", name: "Start", field: "start"},
    {id: "finish", name: "", field: "finish", formatter: myFormatter},
    {id: "effort-driven", name: "Effort Driven", field: "effortDriven"}
  ];
     */
    
    /**
     * 
     * @return multitype:multitype:string
     */
    function getSlickGridColumns() {
        $columns = array();
        $columns[] = array('id'=>'title', 'name'=>'Title','field'=>'title');
        $columns[] = array('id'=>'duration', 'name'=>'duration','field'=>'duration');
        $columns[] = array('id'=>'%', 'name'=>'%','field'=>'percentComplete');
        $columns[] = array('id'=>'start', 'name'=>'Start','field'=>'start');
        $columns[] = array('id'=>'finish', 'name'=>'finish','field'=>'myFormatter');
        $columns[] = array('id'=>'effort-driven', 'name'=>'Effort Driven','field'=>'effortDriven');

        return $columns;
    }
    
    function getColumns2() {
        
        
        $columns = array();
        $columns[] = array('id'=>'title', 'name'=>'Title','field'=>'title');
        $columns[] = array('id'=>'duration', 'name'=>'duration','field'=>'duration');
        $columns[] = array('id'=>'%', 'name'=>'%','field'=>'percentComplete');
        $columns[] = array('id'=>'start', 'name'=>'Start','field'=>'start');
        $columns[] = array('id'=>'finish', 'name'=>'finish','field'=>'myFormatter');
        $columns[] = array('id'=>'effort-driven', 'name'=>'Effort Driven','field'=>'effortDriven');
    
        return $columns;
    }

}