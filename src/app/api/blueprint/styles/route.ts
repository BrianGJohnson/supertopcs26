import { NextRequest, NextResponse } from 'next/server';
import { db, style_gallery } from '@/server/db';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const tier = searchParams.get('tier');
        const category = searchParams.get('category');
        const includeExperimental = searchParams.get('includeExperimental') === 'true';

        // Build query conditions
        const conditions = [eq(style_gallery.is_active, true)];

        if (tier) {
            conditions.push(eq(style_gallery.tier, parseInt(tier)));
        }

        if (category) {
            conditions.push(eq(style_gallery.category, category));
        }

        if (!includeExperimental) {
            conditions.push(eq(style_gallery.is_experimental, false));
        }

        // Fetch styles
        const styles = await db.query.style_gallery.findMany({
            where: conditions.length > 1 ? and(...conditions) : conditions[0],
            orderBy: (style_gallery, { asc }) => [asc(style_gallery.sort_order)],
        });

        // Format response
        const formattedStyles = styles.map(style => ({
            id: style.id,
            styleId: style.style_id,
            name: style.name,
            description: style.description,
            tier: style.tier,
            tierLabel: style.tier_label,
            category: style.category,
            bestFor: style.best_for,
            useCases: style.use_cases,
            recommendedModel: style.recommended_model,
            modelDisplayName: style.model_display_name,
            alternateModels: style.alternate_models,
            textIntegrationRule: style.text_integration_rule,
            previewImageUrl: style.preview_image_url,
            exampleImages: style.example_images,
            isExperimental: style.is_experimental,
            sortOrder: style.sort_order,
        }));

        return NextResponse.json({
            styles: formattedStyles,
            total: formattedStyles.length,
        });

    } catch (error) {
        console.error('[Styles API] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch styles' },
            { status: 500 }
        );
    }
}
