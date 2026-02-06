<?php

namespace App\Http\Controllers;

use App\Services\SchemaFixerService;
use App\Services\SchemaReaderService;
use App\Services\SchemaScannerService;
use Illuminate\Http\Request;
use Throwable;

class SchemaController extends Controller
{
    public function readMasterSchema(SchemaReaderService $reader){
        try{

            $schema = $reader->readSchema('master');
            return response()->json($schema);

        }
        catch(\Throwable $e){

            return response()->json([
                'error' => $e->getMessage()
            ], 500);

        }
    }

    public function readClientSchema(SchemaReaderService $reader){
        try{

            $schema = $reader->readSchema('client');
            return response()->json($schema);

        }
        catch(\Throwable $e){

            return response()->json([
                'error' => $e->getMessage()
            ], 500);

        }
    }

    public function scanSchema(SchemaScannerService $scanner){
        try{

            $schema = $scanner->scan();
            return response()->json($schema);

        }
        catch(\Throwable $e){

            return response()->json([
                'error' => $e->getMessage()
            ], 500);
            
        }
    }

    public function fixSchema(SchemaReaderService $reader, SchemaScannerService $scanner, SchemaFixerService $fixer){
        try{

            $conflicts = $scanner->scan();
            $masterSchema = $reader->readSchema('master');
            $clientSchema = $reader->readSchema('client');

            $message = $fixer->fix($conflicts['conflicts'], $masterSchema['schema'], $clientSchema['schema']);

            return response()->json($message);

        }
        catch(\Throwable $e){

            return response()->json([
                'error' => $e->getMessage()
            ], 500);
            
        }
    }
}
