import {medicineData} from "./../../../data/medicine";
import { NextResponse } from "next/server";
export async function GET() {
    return NextResponse.json((medicineData), {
        headers: {
            "Content-Type": "application/json"
        }
    });
}