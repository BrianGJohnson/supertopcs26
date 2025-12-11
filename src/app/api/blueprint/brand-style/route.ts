import { NextRequest, NextResponse } from 'next/server';
import { db, brand_styles } from '@/server/db';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get('userId');

        if (!userId) {
            // For now, return false if no userId provided
            return NextResponse.json({ hasBrandStyle: false });
        }

        // Check if user has any brand styles
        const userBrandStyles = await db.query.brand_styles.findMany({
            where: eq(brand_styles.user_id, userId),
            limit: 1,
        });

        return NextResponse.json({
            hasBrandStyle: userBrandStyles.length > 0,
        });

    } catch (error) {
        console.error('[Brand Style Check API] Error:', error);
        return NextResponse.json(
            { error: 'Failed to check brand style' },
            { status: 500 }
        );
    }
}
