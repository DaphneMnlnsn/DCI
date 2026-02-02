<?php

namespace App\Http\Controllers;

use App\Services\SchemaReaderService;
use App\Services\SchemaScannerService;
use Illuminate\Http\Request;
use Throwable;

class SchemaController extends Controller
{
    public function readMasterSchema(SchemaReaderService $reader){
        try{

            $schema = $reader->readMaster();
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

            $schema = $reader->readClient();
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
}
