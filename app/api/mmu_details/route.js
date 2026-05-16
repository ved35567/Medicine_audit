import {mmuData} from "./../../../data/mmu";
import { NextResponse } from "next/server";
export async function GET() {
    return NextResponse.json((mmuData), {
        headers: {
            "Content-Type": "application/json"
        }
    });
}