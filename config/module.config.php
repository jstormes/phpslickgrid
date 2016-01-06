<?php
return array(
    
    // Public our assets like JavaScript files and CSS files.
    'asset_manager' => array(
        'resolver_configs' => array(
            'paths' => array(
                __DIR__ . '/../public',
            ),
        ),
    ),
    
//     'view_manager' => array(
//         'template_path_stack' => array(
//             'JStormes' => __DIR__ . '/../view',
//         ),
//     ),
    'view_helpers' => array(
        'invokables' => array(
            'PHPSlickGridHelper' => 'JStormes\PHPSlickGrid\View\Helper\PHPSlickGridHelper',
            //           'BootstrapNav' => 'JStormes\Bootstrap\View\Helper\Navigation\BootstrapNav',
            
        ),
        'factories' => [
            'PHPSlickGrid' => 'JStormes\PHPSlickGrid\View\Helper\PHPSlickGridFactory'
        ]
    ),
    
    'service_manager' => array(
        'invokables' => array(
            'PHPSlickGridTableGateway' => 'JStormes\PHPSlickGrid\Service\Invokable\TableGateway',
        ),
    ),
    
    'table-gateway' => array (
        'map' => array(
        )
    )
    
    
);
