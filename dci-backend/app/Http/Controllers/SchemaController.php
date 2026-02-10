<?php

namespace App\Http\Controllers;

use App\Services\SchemaFixerService;
use App\Services\SchemaReaderService;
use App\Services\SchemaScannerService;
use Illuminate\Http\Request;
use Throwable;

class SchemaController extends Controller
{

    public function readSchema(Request $request, SchemaReaderService $reader)
    {
        try {
            $database = $request->query('database');

            if (!$database) {
                return response()->json(['error' => 'Database not specified'], 400);
            }

            $schema = $reader->readSchemaByDatabase($database);

            return response()->json($schema);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function scanSchema(Request $request, SchemaScannerService $scanner){
        try{
            $source = $request->query('source');
            $target = $request->query('target');

            if (!$source || !$target) {
                return response()->json(['error' => 'Databases not specified'], 400);
            }

            return response()->json(
                $scanner->scan($source, $target)
            );

        }
        catch(\Throwable $e){

            return response()->json([
                'error' => $e->getMessage()
            ], 500);
            
        }
    }

    public function fixSchema(Request $request, SchemaReaderService $reader, SchemaScannerService $scanner, SchemaFixerService $fixer){
        try{

            $source = $request->query('source');
            $target = $request->query('target');

            $masterSchema = $reader->readSchemaByDatabase($source);
            $clientSchema = $reader->readSchemaByDatabase($target);

            $conflicts = $scanner->scan($source, $target);
            
            $message = $fixer->fix($conflicts['conflicts'], $masterSchema['schema'], $clientSchema['schema'], $target);

            return response()->json($message);

        }
        catch(\Throwable $e){

            return response()->json([
                'error' => $e->getMessage()
            ], 500);
            
        }
    }

    public function readAllDatabases(SchemaReaderService $reader){
        try{

            $schema = $reader->readAllDatabases();
            return response()->json($schema);

        }
        catch(\Throwable $e){

            return response()->json([
                'error' => $e->getMessage()
            ], 500);

        }
    }
}
