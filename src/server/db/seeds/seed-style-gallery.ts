// Load environment variables FIRST before any other imports
import { config } from 'dotenv';
config({ path: '.env.local' });

// Now import dependencies after env vars are loaded
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { style_gallery } from '../schema';

// Create database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('DATABASE_URL is not set in environment');
}

const pool = new Pool({ connectionString });
const db = drizzle(pool);

async function seedStyleGallery() {
    console.log('🎨 Seeding style gallery with 15 curated styles...\n');

    const styles = [
        // TIER 1: PRODUCTION READY (8 styles)
        {
            style_id: 'dark_mode_dashboard',
            name: 'Dark Mode Dashboard',
            description: 'Cyberpunk SaaS interface with neon-on-black aesthetic. Perfect for tech, AI, and developer content. Features matte black backgrounds with glowing UI elements and code snippets.',
            tier: 1,
            tier_label: 'Production Ready',
            category: 'tech',
            best_for: ['SaaS', 'Tech', 'AI', 'Cybersecurity', 'Developer Tools'],
            use_cases: ['Tech tutorials', 'AI news', 'Developer content', 'Coding guides'],
            recommended_model: 'gemini_3',
            model_display_name: 'Gemini 3 (Nano Banana)',
            alternate_models: ['ideogram_v2'],
            prompt_template: 'Style: Cyberpunk SaaS Dashboard, dark mode aesthetic. Visuals: Matte black background (#0A0A0A) with subtle dark grey topographic map pattern, floating glassmorphism UI screens displaying code snippets and data visualizations, glowing neon ${BRAND_COLOR} accent borders around screens. Composition: Center-weighted, multiple floating screens arranged in depth. Text Rule: Render the text "${TEXT}" as the main header on the central dashboard screen in a monospaced coding font (e.g., "Fira Code", "JetBrains Mono"), glowing with ${BRAND_COLOR} color. Lighting: Dark moody atmosphere, tech wireframe aesthetic, high contrast between black background and glowing elements, subtle rim lighting on screens. Technical: 8k render, sharp digital precision, clean edges, professional tech aesthetic. Aspect Ratio: 16:9. Mood: Professional, futuristic, cybersecurity, developer-focused.',
            text_integration_rule: 'Render as glowing monospace text on the central dashboard screen',
            sort_order: 1,
            is_active: true,
            is_experimental: false,
        },
        {
            style_id: 'modern_tech_vector',
            name: 'Modern Tech Vector',
            description: 'Flat vector illustration with Corporate Memphis 2.0 aesthetic. Clean, vibrant, and professional. Perfect for startups, business, and educational content.',
            tier: 1,
            tier_label: 'Production Ready',
            category: 'tech',
            best_for: ['Startups', 'Business', 'Education', 'SaaS', 'Productivity'],
            use_cases: ['Business advice', 'Productivity tips', 'SaaS reviews', 'Startup stories'],
            recommended_model: 'gemini_3',
            model_display_name: 'Gemini 3 (Nano Banana)',
            alternate_models: [],
            prompt_template: 'Style: Corporate Memphis 2.0 Vector illustration, flat design. Visuals: Minimalist characters with exaggerated limbs and proportions, thick clean strokes, solid vibrant colors (no gradients), geometric shapes. Colors: High saturation solid blocks using ${BRAND_COLOR} as primary. Composition: Center-weighted, balanced layout. Text Rule: Render the text "${TEXT}" inside a floating speech bubble or UI card in the center, bold sans-serif font. Lighting: Flat, no shadows, even illumination. Technical: Vector art style, clean lines, Behance trend aesthetic. Aspect Ratio: 16:9. Mood: Tech startup, trustworthy, smart, approachable.',
            text_integration_rule: 'Render as bold text inside a floating speech bubble or UI card',
            sort_order: 2,
            is_active: true,
            is_experimental: false,
        },
        {
            style_id: 'glassmorphism',
            name: 'Glassmorphism',
            description: 'Futuristic frosted glass UI with holographic gradients. Apple Vision Pro inspired aesthetic perfect for AI, crypto, and future tech topics.',
            tier: 1,
            tier_label: 'Production Ready',
            category: 'tech',
            best_for: ['AI', 'Crypto', 'Future Tech', 'VR/AR', 'Innovation'],
            use_cases: ['AI tools', 'Future tech', 'Crypto analysis', 'VR/AR content'],
            recommended_model: 'gemini_3',
            model_display_name: 'Gemini 3 (Nano Banana)',
            alternate_models: [],
            prompt_template: 'Style: 3D Glassmorphism UI design, futuristic aesthetic. Visuals: Layers of frosted glass with blur effect (backdrop-filter), holographic gradients (blue to pink to purple), floating metallic spheres, soft depth of field. Colors: Colorful soft gradients with ${BRAND_COLOR} as accent. Composition: Layered depth, floating elements. Text Rule: Render the text "${TEXT}" etched into the front-most glass panel with a soft white glow and subtle transparency. Font: Thin, ultra-modern sans-serif. Lighting: Soft ethereal glow, high key lighting, clean and airy, subtle rim lighting on glass edges. Technical: 3D render, smooth surfaces, premium feel. Aspect Ratio: 16:9. Mood: Futurism, AI, innovation, premium.',
            text_integration_rule: 'Render as etched text on frosted glass panel with soft glow',
            sort_order: 3,
            is_active: true,
            is_experimental: false,
        },
        {
            style_id: 'clay_toy_3d',
            name: '3D Clay Toy',
            description: 'Soft, friendly 3D renders with Pixar-like charm. Matte plastic textures and cute proportions make content approachable and wholesome.',
            tier: 1,
            tier_label: 'Production Ready',
            category: 'friendly',
            best_for: ['Beginner Content', 'Family Friendly', 'Tutorials', 'Wholesome'],
            use_cases: ['Beginner tutorials', 'Family content', 'Wholesome topics', 'Educational'],
            recommended_model: 'gemini_3',
            model_display_name: 'Gemini 3 (Nano Banana)',
            alternate_models: [],
            prompt_template: 'Style: 3D Claymorphism, Pixar-inspired render. Visuals: Soft rounded shapes, matte plastic texture, cute stylized proportions, oversized objects, pastel color palette. Colors: Bright, friendly colors with ${BRAND_COLOR} as primary. Composition: Centered subject on simple background. Text Rule: Render the text "${TEXT}" as soft, inflated 3D balloon letters sitting on the floor of the scene, same matte plastic material. Lighting: Bright soft-box studio lighting, ambient occlusion, no harsh shadows, friendly and approachable. Technical: Octane render, smooth surfaces, high quality 3D. Aspect Ratio: 16:9. Mood: Friendly, approachable, wholesome, fun.',
            text_integration_rule: 'Render as inflated 3D balloon letters on the scene floor',
            sort_order: 4,
            is_active: true,
            is_experimental: false,
        },
        {
            style_id: 'isometric_world',
            name: 'Isometric World',
            description: 'Low-poly isometric 3D render of a miniature world. Perfect for explaining systems, processes, and technical concepts in a visual way.',
            tier: 1,
            tier_label: 'Production Ready',
            category: 'tech',
            best_for: ['Systems', 'Processes', 'Explainers', 'Technical Content'],
            use_cases: ['How-to guides', 'System explanations', 'Tech breakdowns', 'Process tutorials'],
            recommended_model: 'gemini_3',
            model_display_name: 'Gemini 3 (Nano Banana)',
            alternate_models: [],
            prompt_template: 'Style: Low-Poly Isometric 3D render, SimCity aesthetic. Visuals: A floating island platform containing a miniature version of the concept and environment, clean geometric lines, matte finish materials, simple shapes. Colors: Solid gradient background, ${BRAND_COLOR} as accent on key elements. Composition: Isometric view (30° angle), centered floating island. Text Rule: Render the text "${TEXT}" as massive 3D block letters standing on the island platform next to the subject, same low-poly style. Lighting: Global illumination, soft shadows, clean and bright. Technical: Low-poly 3D, clean edges, professional render. Aspect Ratio: 16:9. Mood: Technical, clear, organized, professional.',
            text_integration_rule: 'Render as massive 3D block letters standing on the island platform',
            sort_order: 5,
            is_active: true,
            is_experimental: false,
        },
        {
            style_id: 'blueprint_schematic',
            name: 'The Blueprint',
            description: 'Technical architectural blueprint style with white chalk lines on deep navy grid. Perfect for deep dives, technical analysis, and "how it works" content.',
            tier: 1,
            tier_label: 'Production Ready',
            category: 'tech',
            best_for: ['Technical', 'Engineering', 'Deep Dives', 'Analysis'],
            use_cases: ['Engineering content', 'Architecture', 'Technical analysis', 'How it works'],
            recommended_model: 'gemini_3',
            model_display_name: 'Gemini 3 (Nano Banana)',
            alternate_models: [],
            prompt_template: 'Style: Technical architectural blueprint, engineering schematic. Visuals: Deep navy blue grid paper background (#1A2332), white chalk-style schematic lines, "exploded view" of the subject showing internal components, floating HUD measurement arrows, mathematical formulas, technical annotations. Colors: Navy background, white lines, ${BRAND_COLOR} for highlights. Composition: Centered exploded view diagram. Text Rule: Render the text "${TEXT}" as a stenciled "Project Title" label in the bottom center, enclosed in a technical box with measurement lines. Font: Stencil or technical drafting font. Lighting: Flat, blueprint aesthetic, high contrast. Technical: Precision, technical drawing style. Aspect Ratio: 16:9. Mood: Precision, secret knowledge, deconstructed, technical.',
            text_integration_rule: 'Render as stenciled project title in technical box at bottom center',
            sort_order: 6,
            is_active: true,
            is_experimental: false,
        },
        {
            style_id: 'gta_comic',
            name: 'GTA Loading Screen',
            description: 'Grand Theft Auto loading screen art style with cel-shaded realism and heavy black ink outlines. Perfect for gaming, pop culture, and dramatic storytelling.',
            tier: 1,
            tier_label: 'Production Ready',
            category: 'viral',
            best_for: ['Gaming', 'Pop Culture', 'Entertainment', 'Storytelling'],
            use_cases: ['Gaming content', 'Pop culture', 'Dramatic storytelling', 'Character-focused'],
            recommended_model: 'gemini_3',
            model_display_name: 'Gemini 3 (Nano Banana)',
            alternate_models: [],
            prompt_template: 'Style: Grand Theft Auto loading screen art, comic book realism. Visuals: Digital painting, cel-shaded realism, heavy black comic book ink outlines, dramatic character pose, sunset color palette (Orange/Gold). Colors: Saturated sunset palette with ${BRAND_COLOR} as accent. Composition: Dynamic character pose, rule of thirds. Text Rule: Render the text "${TEXT}" in the bottom right using the "Pricedown" (GTA style) font, white text with thick black outline. Lighting: Dramatic high contrast shadows, "Golden Hour" lighting, cinematic. Technical: Digital painting, cel-shaded, comic book style. Aspect Ratio: 16:9. Mood: Dramatic, cool, stylized, action-packed.',
            text_integration_rule: 'Render in GTA "Pricedown" font style at bottom right with black outline',
            sort_order: 7,
            is_active: true,
            is_experimental: false,
        },
        {
            style_id: 'neon_gamer',
            name: 'Neon Gamer',
            description: 'Dark room with LED lights and lightning effects. Esports competitive graphic style perfect for gaming and high-energy content.',
            tier: 1,
            tier_label: 'Production Ready',
            category: 'viral',
            best_for: ['Gaming', 'Esports', 'High Energy', 'Competitive'],
            use_cases: ['Gaming content', 'Competitive content', 'Hype videos', 'Esports'],
            recommended_model: 'ideogram_v2',
            model_display_name: 'Ideogram v2',
            alternate_models: ['gemini_3'],
            prompt_template: 'Style: Esports competitive graphic, dark room aesthetic. Visuals: Subject in action (shouting or focused), glowing eyes effect, speed lines, lightning bolts in background, dark purple and teal duotone gradient. Colors: Deep purple and teal with ${BRAND_COLOR} as neon accent. Composition: Centered subject with energy radiating outward. Text Rule: Render the text "${TEXT}" as a metallic chrome logo with a glowing ${BRAND_COLOR} outline in the center of the screen, floating above subject. Lighting: Heavy bloom, lens flares, dramatic backlighting, neon glow. Technical: High contrast, cinematic, esports aesthetic. Aspect Ratio: 16:9. Mood: High energy, competitive, intense, hype.',
            text_integration_rule: 'Render as metallic chrome logo with glowing neon outline',
            sort_order: 8,
            is_active: true,
            is_experimental: false,
        },

        // TIER 2: STRONG POTENTIAL (4 styles)
        {
            style_id: 'hyper_real_hype',
            name: 'Hyper-Real Hype',
            description: 'MrBeast-style hyper-realistic photography with extreme emotion and wide-angle lens distortion. Maximum click-through rate for viral content.',
            tier: 2,
            tier_label: 'Strong Potential',
            category: 'viral',
            best_for: ['Viral', 'High CTR', 'Entertainment', 'Challenges'],
            use_cases: ['Vlogs', 'Challenges', 'Viral content', 'Reaction videos'],
            recommended_model: 'flux_1.1_pro',
            model_display_name: 'Flux 1.1 Pro',
            alternate_models: ['gemini_3'],
            prompt_template: 'Style: YouTube High-CTR Photography, MrBeast aesthetic. Visuals: Hyper-realistic 8k photo, subject looking at camera with extreme emotion (shock, excitement, fear), eyes slightly widened and brightened. Lens: 16mm Wide-Angle (fisheye distortion) close-up. Colors: Saturated +20%, ${BRAND_COLOR} as background accent. Composition: Subject fills frame, rule of thirds. Text Rule: Render the text "${TEXT}" floating next to the head in massive "Impact" font with thick black stroke (5px) and drop shadow. Lighting: Harsh studio "rim lighting" (backlight) to separate subject, high contrast. Technical: 8k resolution, hyper-realistic skin texture, crunchy detail. Aspect Ratio: 16:9. Mood: Viral, shocking, high energy, click-worthy.',
            text_integration_rule: 'Render as massive Impact font with thick black stroke next to head',
            sort_order: 9,
            is_active: true,
            is_experimental: false,
        },
        {
            style_id: 'sticker_bomb',
            name: 'Sticker Bomb',
            description: 'Chaotic Gen Z collage aesthetic with sticker art and floating emojis. Perfect for TikTok-style content and young audiences.',
            tier: 2,
            tier_label: 'Strong Potential',
            category: 'viral',
            best_for: ['Gen Z', 'TikTok', 'Memes', 'Youth Content'],
            use_cases: ['TikTok-style content', 'Memes', 'Youth-focused', 'Chaotic energy'],
            recommended_model: 'ideogram_v2',
            model_display_name: 'Ideogram v2',
            alternate_models: [],
            prompt_template: 'Style: YouTube thumbnail composite, Gen Z sticker art collage aesthetic. Visuals: Main subject cut out with a thick white border (3-5px) creating a sticker effect, background explosion of floating 3D emojis (😱🔥💯), abstract geometric shapes, speed lines radiating outward, vibrant chaotic energy. Colors: High saturation, clashing neon colors (hot pink, electric blue, lime green), ${BRAND_COLOR} as accent. Composition: Asymmetric, energetic chaos, paper texture overlay for authenticity. Text Rule: Render the text "${TEXT}" as a large die-cut sticker in the foreground with a white stroke outline, grunge texture, slight peel effect on corners, bold sans-serif font. Lighting: Flat, evenly lit, no dramatic shadows, bright and punchy. Technical: Collage aesthetic, visible layer separation, TikTok/YouTube thumbnail style. Aspect Ratio: 16:9. Mood: Chaotic, fun, young audience, high energy, viral.',
            text_integration_rule: 'Render as die-cut sticker with white outline and peel effect',
            sort_order: 10,
            is_active: true,
            is_experimental: false,
        },
        {
            style_id: 'double_exposure',
            name: 'Double Exposure',
            description: 'Cinematic double exposure with silhouette head filled with a vibrant scene. Perfect for conceptual, artistic, and psychology content.',
            tier: 2,
            tier_label: 'Strong Potential',
            category: 'artistic',
            best_for: ['Conceptual', 'Artistic', 'Psychology', 'Philosophy'],
            use_cases: ['Mindset content', 'Philosophy', 'Abstract concepts', 'Artistic storytelling'],
            recommended_model: 'gemini_3',
            model_display_name: 'Gemini 3 (Nano Banana)',
            alternate_models: [],
            prompt_template: 'Style: Cinematic Double Exposure photography. Visuals: Side profile silhouette of a human head, inside the silhouette is a vibrant landscape or scene related to the topic. Background: Pure solid white for maximum contrast. Colors: Vibrant scene inside silhouette, ${BRAND_COLOR} as accent. Composition: Profile silhouette on left or right third. Text Rule: Render the text "${TEXT}" in elegant serif font floating in the negative space outside the head, subtle and sophisticated. Lighting: High contrast, sharp transition lines between silhouette and background, surreal blend. Technical: Photographic quality, clean edges, artistic. Aspect Ratio: 16:9. Mood: Conceptual, artistic, introspective, surreal.',
            text_integration_rule: 'Render as elegant serif font in negative space outside silhouette',
            sort_order: 11,
            is_active: true,
            is_experimental: false,
        },
        {
            style_id: 'knolling_grid',
            name: 'Knolling Grid',
            description: 'Overhead flat lay with objects arranged in perfect 90-degree grid. Great for organization, reviews, and comparison content.',
            tier: 2,
            tier_label: 'Strong Potential',
            category: 'tech',
            best_for: ['Organization', 'Reviews', 'Comparisons', 'Tech Unboxing'],
            use_cases: ['Product reviews', 'Organization tips', 'Tech unboxing', 'Comparison videos'],
            recommended_model: 'gemini_3',
            model_display_name: 'Gemini 3 (Nano Banana)',
            alternate_models: [],
            prompt_template: 'Style: Knolling photography, overhead flat lay. Composition: Overhead flat lay shot (90-degree angle from above), objects organized neatly in a grid pattern, symmetrical and spaced evenly, all items at 90-degree angles. Colors: Clean solid color background, ${BRAND_COLOR} as accent. Text Rule: Render the text "${TEXT}" as a centered label in the grid, integrated as if it\'s another object in the arrangement. Lighting: Even studio lighting, no harsh shadows, flat and clean. Technical: High resolution, sharp focus, organized aesthetic. Aspect Ratio: 16:9. Mood: Organized, clean, satisfying, methodical.',
            text_integration_rule: 'Render as centered label integrated into the grid layout',
            sort_order: 12,
            is_active: true,
            is_experimental: false,
        },

        // TIER 3: EXPERIMENTAL (3 styles)
        {
            style_id: 'paper_diorama',
            name: 'Paper Diorama',
            description: 'Whimsical layered papercraft with visible depth. Handcrafted aesthetic perfect for storytelling and cozy content. (Experimental: Texture refinement needed)',
            tier: 3,
            tier_label: 'Experimental',
            category: 'artistic',
            best_for: ['Storytelling', 'Crafts', 'Nostalgic', 'Cozy'],
            use_cases: ['Storytelling', 'Crafts', 'Nostalgic content', 'Whimsical topics'],
            recommended_model: 'gemini_3',
            model_display_name: 'Gemini 3 (Nano Banana)',
            alternate_models: [],
            prompt_template: 'Style: Layered Papercraft Diorama, handmade aesthetic. Visuals: Objects appear made of cut construction paper with visible fiber texture, depth created by stacking layers at different distances, warm cozy color palette. Colors: Warm, cozy colors with ${BRAND_COLOR} as accent. Composition: Layered depth, multiple planes. Text Rule: Render the text "${TEXT}" as if cut out of white cardboard, standing up in the center of the diorama, casting shadows on layers behind. Lighting: Hard shadows cast by layers to show depth, warm cozy overhead lighting. Technical: Paper texture, visible layers, handcrafted feel. Aspect Ratio: 16:9. Mood: Whimsical, handcrafted, cozy, nostalgic.',
            text_integration_rule: 'Render as white cardboard cutout standing in diorama center',
            sort_order: 13,
            is_active: true,
            is_experimental: true,
        },
        {
            style_id: 'neo_brutalist',
            name: 'Neo-Brutalist',
            description: 'Raw, anti-design aesthetic with clashing colors and default fonts. Ironic and edgy. (Experimental: Niche appeal, hit-or-miss)',
            tier: 3,
            tier_label: 'Experimental',
            category: 'artistic',
            best_for: ['Design Critique', 'Internet Culture', 'Edgy', 'Ironic'],
            use_cases: ['Design critique', 'Internet culture', 'Edgy content', 'Anti-establishment'],
            recommended_model: 'ideogram_v2',
            model_display_name: 'Ideogram v2',
            alternate_models: [],
            prompt_template: 'Style: Neo-Brutalism web design, anti-design aesthetic. Visuals: Stark plain rectangles, default system fonts (Courier, Times New Roman), high-contrast strokes (thick black outlines), clashing neon colors (neon green on hot pink). Colors: Clashing neon colors, ${BRAND_COLOR} as one of the clash colors. Composition: Asymmetric, intentionally awkward, raw. Text Rule: Render the text "${TEXT}" in a chaotic "Times New Roman" font inside a jagged warning box with thick black border, intentionally ugly. Shadows: Hard, unblurred black drop shadows. Technical: Raw, unpolished, ironic. Aspect Ratio: 16:9. Mood: Raw, anti-design, ironic, edgy, internet culture.',
            text_integration_rule: 'Render in Times New Roman inside jagged warning box',
            sort_order: 14,
            is_active: true,
            is_experimental: true,
        },
        {
            style_id: 'retro_vhs',
            name: 'Retro VHS',
            description: '90s VHS camcorder footage with scan lines and tracking errors. Perfect for horror, conspiracy, and retro content. (Experimental: Hardest to nail, needs iteration)',
            tier: 3,
            tier_label: 'Experimental',
            category: 'artistic',
            best_for: ['Horror', 'Conspiracy', 'Retro', 'Mystery'],
            use_cases: ['Horror content', 'Conspiracy theories', 'Retro gaming', 'Mystery videos'],
            recommended_model: 'flux_1.1_pro',
            model_display_name: 'Flux 1.1 Pro',
            alternate_models: [],
            prompt_template: 'Style: 1990s VHS camcorder footage, analog horror aesthetic. Effects: Chromatic aberration, scan lines, static noise, tracking error glitch, washed out colors. Colors: Low fidelity, desaturated, ${BRAND_COLOR} heavily degraded. Composition: Slightly off-center, amateur camcorder feel. Text Rule: Render the text "${TEXT}" as a bright green VCR On-Screen Display (OSD) timestamp in the bottom left corner, pixelated font. Overlay: Green "REC" text and digital timestamp in top right. Lighting: Dark moody lighting, low fidelity, grainy. Technical: VHS artifacts, low resolution feel, analog degradation. Aspect Ratio: 16:9. Mood: Horror, conspiracy, retro, unsettling, nostalgic.',
            text_integration_rule: 'Render as green VCR timestamp overlay in bottom left',
            sort_order: 15,
            is_active: true,
            is_experimental: true,
        },
    ];

    try {
        // Insert all styles
        for (const style of styles) {
            await db.insert(style_gallery).values(style);
            console.log(`✅ Inserted: ${style.name} (Tier ${style.tier})`);
        }

        console.log(`\n🎉 Successfully seeded ${styles.length} styles!`);
        console.log('\nBreakdown:');
        console.log(`  - Tier 1 (Production Ready): 8 styles`);
        console.log(`  - Tier 2 (Strong Potential): 4 styles`);
        console.log(`  - Tier 3 (Experimental): 3 styles`);
    } catch (error) {
        console.error('❌ Error seeding style gallery:', error);
        throw error;
    }
}

seedStyleGallery();
