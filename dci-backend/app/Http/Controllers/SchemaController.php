<?php

namespace App\Http\Controllers;

use App\Services\SchemaReaderService;
use Illuminate\Http\Request;
use Throwable;

class SchemaController extends Controller
{
    public function readSchema(SchemaReaderService $read){
        try{
        $schema = $read->read();
        return response()->json($schema);
        }
        catch(\Throwable $e){
            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
