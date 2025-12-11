-- ============================================================
-- STYLE GALLERY SEED DATA
-- 15 curated thumbnail styles for Blueprint system
-- Run this after schema migration
-- ============================================================

-- TIER 1: PRODUCTION READY (8 styles)
-- These are the styles AI will absolutely crush

-- 1. Dark Mode Dashboard (Firecrawl/Deep Agent Look)
INSERT INTO style_gallery (
  style_id, name, description, tier, tier_label, category,
  best_for, use_cases,
  recommended_model, model_display_name, alternate_models,
  prompt_template, text_integration_rule,
  sort_order, is_active, is_experimental
) VALUES (
  'dark_mode_dashboard',
  'Dark Mode Dashboard',
  'Cyberpunk SaaS interface with neon-on-black aesthetic. Perfect for tech, AI, and developer content. Features matte black backgrounds with glowing UI elements and code snippets.',
  1,
  'Production Ready',
  'tech',
  '["SaaS", "Tech", "AI", "Cybersecurity", "Developer Tools"]',
  '["Tech tutorials", "AI news", "Developer content", "Coding guides"]',
  'gemini_3',
  'Gemini 3 (Nano Banana)',
  '["ideogram_v2"]',
  'Style: Cyberpunk SaaS Dashboard, dark mode aesthetic. Visuals: Matte black background (#0A0A0A) with subtle dark grey topographic map pattern, floating glassmorphism UI screens displaying code snippets and data visualizations, glowing neon ${BRAND_COLOR} accent borders around screens. Composition: Center-weighted, multiple floating screens arranged in depth. Text Rule: Render the text "${TEXT}" as the main header on the central dashboard screen in a monospaced coding font (e.g., "Fira Code", "JetBrains Mono"), glowing with ${BRAND_COLOR} color. Lighting: Dark moody atmosphere, tech wireframe aesthetic, high contrast between black background and glowing elements, subtle rim lighting on screens. Technical: 8k render, sharp digital precision, clean edges, professional tech aesthetic. Aspect Ratio: 16:9. Mood: Professional, futuristic, cybersecurity, developer-focused.',
  'Render as glowing monospace text on the central dashboard screen',
  1,
  true,
  false
);

-- 2. Modern Tech Vector (Abacus/Corporate Memphis)
INSERT INTO style_gallery (
  style_id, name, description, tier, tier_label, category,
  best_for, use_cases,
  recommended_model, model_display_name, alternate_models,
  prompt_template, text_integration_rule,
  sort_order, is_active, is_experimental
) VALUES (
  'modern_tech_vector',
  'Modern Tech Vector',
  'Flat vector illustration with Corporate Memphis 2.0 aesthetic. Clean, vibrant, and professional. Perfect for startups, business, and educational content.',
  1,
  'Production Ready',
  'tech',
  '["Startups", "Business", "Education", "SaaS", "Productivity"]',
  '["Business advice", "Productivity tips", "SaaS reviews", "Startup stories"]',
  'gemini_3',
  'Gemini 3 (Nano Banana)',
  '[]',
  'Style: Corporate Memphis 2.0 Vector illustration, flat design. Visuals: Minimalist characters with exaggerated limbs and proportions, thick clean strokes, solid vibrant colors (no gradients), geometric shapes. Colors: High saturation solid blocks using ${BRAND_COLOR} as primary. Composition: Center-weighted, balanced layout. Text Rule: Render the text "${TEXT}" inside a floating speech bubble or UI card in the center, bold sans-serif font. Lighting: Flat, no shadows, even illumination. Technical: Vector art style, clean lines, Behance trend aesthetic. Aspect Ratio: 16:9. Mood: Tech startup, trustworthy, smart, approachable.',
  'Render as bold text inside a floating speech bubble or UI card',
  2,
  true,
  false
);

-- 3. Glassmorphism (Apple Vision Pro Aesthetic)
INSERT INTO style_gallery (
  style_id, name, description, tier, tier_label, category,
  best_for, use_cases,
  recommended_model, model_display_name, alternate_models,
  prompt_template, text_integration_rule,
  sort_order, is_active, is_experimental
) VALUES (
  'glassmorphism',
  'Glassmorphism',
  'Futuristic frosted glass UI with holographic gradients. Apple Vision Pro inspired aesthetic perfect for AI, crypto, and future tech topics.',
  1,
  'Production Ready',
  'tech',
  '["AI", "Crypto", "Future Tech", "VR/AR", "Innovation"]',
  '["AI tools", "Future tech", "Crypto analysis", "VR/AR content"]',
  'gemini_3',
  'Gemini 3 (Nano Banana)',
  '[]',
  'Style: 3D Glassmorphism UI design, futuristic aesthetic. Visuals: Layers of frosted glass with blur effect (backdrop-filter), holographic gradients (blue to pink to purple), floating metallic spheres, soft depth of field. Colors: Colorful soft gradients with ${BRAND_COLOR} as accent. Composition: Layered depth, floating elements. Text Rule: Render the text "${TEXT}" etched into the front-most glass panel with a soft white glow and subtle transparency. Font: Thin, ultra-modern sans-serif. Lighting: Soft ethereal glow, high key lighting, clean and airy, subtle rim lighting on glass edges. Technical: 3D render, smooth surfaces, premium feel. Aspect Ratio: 16:9. Mood: Futurism, AI, innovation, premium.',
  'Render as etched text on frosted glass panel with soft glow',
  3,
  true,
  false
);

-- 4. 3D Clay Toy (Pixar/Vinyl Toy Style)
INSERT INTO style_gallery (
  style_id, name, description, tier, tier_label, category,
  best_for, use_cases,
  recommended_model, model_display_name, alternate_models,
  prompt_template, text_integration_rule,
  sort_order, is_active, is_experimental
) VALUES (
  'clay_toy_3d',
  '3D Clay Toy',
  'Soft, friendly 3D renders with Pixar-like charm. Matte plastic textures and cute proportions make content approachable and wholesome.',
  1,
  'Production Ready',
  'friendly',
  '["Beginner Content", "Family Friendly", "Tutorials", "Wholesome"]',
  '["Beginner tutorials", "Family content", "Wholesome topics", "Educational"]',
  'gemini_3',
  'Gemini 3 (Nano Banana)',
  '[]',
  'Style: 3D Claymorphism, Pixar-inspired render. Visuals: Soft rounded shapes, matte plastic texture, cute stylized proportions, oversized objects, pastel color palette. Colors: Bright, friendly colors with ${BRAND_COLOR} as primary. Composition: Centered subject on simple background. Text Rule: Render the text "${TEXT}" as soft, inflated 3D balloon letters sitting on the floor of the scene, same matte plastic material. Lighting: Bright soft-box studio lighting, ambient occlusion, no harsh shadows, friendly and approachable. Technical: Octane render, smooth surfaces, high quality 3D. Aspect Ratio: 16:9. Mood: Friendly, approachable, wholesome, fun.',
  'Render as inflated 3D balloon letters on the scene floor',
  4,
  true,
  false
);

-- 5. Isometric World (SimCity/Monument Valley)
INSERT INTO style_gallery (
  style_id, name, description, tier, tier_label, category,
  best_for, use_cases,
  recommended_model, model_display_name, alternate_models,
  prompt_template, text_integration_rule,
  sort_order, is_active, is_experimental
) VALUES (
  'isometric_world',
  'Isometric World',
  'Low-poly isometric 3D render of a miniature world. Perfect for explaining systems, processes, and technical concepts in a visual way.',
  1,
  'Production Ready',
  'tech',
  '["Systems", "Processes", "Explainers", "Technical Content"]',
  '["How-to guides", "System explanations", "Tech breakdowns", "Process tutorials"]',
  'gemini_3',
  'Gemini 3 (Nano Banana)',
  '[]',
  'Style: Low-Poly Isometric 3D render, SimCity aesthetic. Visuals: A floating island platform containing a miniature version of the concept and environment, clean geometric lines, matte finish materials, simple shapes. Colors: Solid gradient background, ${BRAND_COLOR} as accent on key elements. Composition: Isometric view (30° angle), centered floating island. Text Rule: Render the text "${TEXT}" as massive 3D block letters standing on the island platform next to the subject, same low-poly style. Lighting: Global illumination, soft shadows, clean and bright. Technical: Low-poly 3D, clean edges, professional render. Aspect Ratio: 16:9. Mood: Technical, clear, organized, professional.',
  'Render as massive 3D block letters standing on the island platform',
  5,
  true,
  false
);

-- 6. The Blueprint (Engineering Schematic)
INSERT INTO style_gallery (
  style_id, name, description, tier, tier_label, category,
  best_for, use_cases,
  recommended_model, model_display_name, alternate_models,
  prompt_template, text_integration_rule,
  sort_order, is_active, is_experimental
) VALUES (
  'blueprint_schematic',
  'The Blueprint',
  'Technical architectural blueprint style with white chalk lines on deep navy grid. Perfect for deep dives, technical analysis, and "how it works" content.',
  1,
  'Production Ready',
  'tech',
  '["Technical", "Engineering", "Deep Dives", "Analysis"]',
  '["Engineering content", "Architecture", "Technical analysis", "How it works"]',
  'gemini_3',
  'Gemini 3 (Nano Banana)',
  '[]',
  'Style: Technical architectural blueprint, engineering schematic. Visuals: Deep navy blue grid paper background (#1A2332), white chalk-style schematic lines, "exploded view" of the subject showing internal components, floating HUD measurement arrows, mathematical formulas, technical annotations. Colors: Navy background, white lines, ${BRAND_COLOR} for highlights. Composition: Centered exploded view diagram. Text Rule: Render the text "${TEXT}" as a stenciled "Project Title" label in the bottom center, enclosed in a technical box with measurement lines. Font: Stencil or technical drafting font. Lighting: Flat, blueprint aesthetic, high contrast. Technical: Precision, technical drawing style. Aspect Ratio: 16:9. Mood: Precision, secret knowledge, deconstructed, technical.',
  'Render as stenciled project title in technical box at bottom center',
  6,
  true,
  false
);

-- 7. GTA Loading Screen (Comic Book Realism)
INSERT INTO style_gallery (
  style_id, name, description, tier, tier_label, category,
  best_for, use_cases,
  recommended_model, model_display_name, alternate_models,
  prompt_template, text_integration_rule,
  sort_order, is_active, is_experimental
) VALUES (
  'gta_comic',
  'GTA Loading Screen',
  'Grand Theft Auto loading screen art style with cel-shaded realism and heavy black ink outlines. Perfect for gaming, pop culture, and dramatic storytelling.',
  1,
  'Production Ready',
  'viral',
  '["Gaming", "Pop Culture", "Entertainment", "Storytelling"]',
  '["Gaming content", "Pop culture", "Dramatic storytelling", "Character-focused"]',
  'gemini_3',
  'Gemini 3 (Nano Banana)',
  '[]',
  'Style: Grand Theft Auto loading screen art, comic book realism. Visuals: Digital painting, cel-shaded realism, heavy black comic book ink outlines, dramatic character pose, sunset color palette (Orange/Gold). Colors: Saturated sunset palette with ${BRAND_COLOR} as accent. Composition: Dynamic character pose, rule of thirds. Text Rule: Render the text "${TEXT}" in the bottom right using the "Pricedown" (GTA style) font, white text with thick black outline. Lighting: Dramatic high contrast shadows, "Golden Hour" lighting, cinematic. Technical: Digital painting, cel-shaded, comic book style. Aspect Ratio: 16:9. Mood: Dramatic, cool, stylized, action-packed.',
  'Render in GTA "Pricedown" font style at bottom right with black outline',
  7,
  true,
  false
);

-- 8. Neon Gamer (Esports/Dark Room Aesthetic)
INSERT INTO style_gallery (
  style_id, name, description, tier, tier_label, category,
  best_for, use_cases,
  recommended_model, model_display_name, alternate_models,
  prompt_template, text_integration_rule,
  sort_order, is_active, is_experimental
) VALUES (
  'neon_gamer',
  'Neon Gamer',
  'Dark room with LED lights and lightning effects. Esports competitive graphic style perfect for gaming and high-energy content.',
  1,
  'Production Ready',
  'viral',
  '["Gaming", "Esports", "High Energy", "Competitive"]',
  '["Gaming content", "Competitive content", "Hype videos", "Esports"]',
  'ideogram_v2',
  'Ideogram v2',
  '["gemini_3"]',
  'Style: Esports competitive graphic, dark room aesthetic. Visuals: Subject in action (shouting or focused), glowing eyes effect, speed lines, lightning bolts in background, dark purple and teal duotone gradient. Colors: Deep purple and teal with ${BRAND_COLOR} as neon accent. Composition: Centered subject with energy radiating outward. Text Rule: Render the text "${TEXT}" as a metallic chrome logo with a glowing ${BRAND_COLOR} outline in the center of the screen, floating above subject. Lighting: Heavy bloom, lens flares, dramatic backlighting, neon glow. Technical: High contrast, cinematic, esports aesthetic. Aspect Ratio: 16:9. Mood: High energy, competitive, intense, hype.',
  'Render as metallic chrome logo with glowing neon outline',
  8,
  true,
  false
);

-- TIER 2: STRONG POTENTIAL (4 styles)
-- These work well but may require iteration

-- 9. Hyper-Real Hype (MrBeast Style)
INSERT INTO style_gallery (
  style_id, name, description, tier, tier_label, category,
  best_for, use_cases,
  recommended_model, model_display_name, alternate_models,
  prompt_template, text_integration_rule,
  sort_order, is_active, is_experimental
) VALUES (
  'hyper_real_hype',
  'Hyper-Real Hype',
  'MrBeast-style hyper-realistic photography with extreme emotion and wide-angle lens distortion. Maximum click-through rate for viral content.',
  2,
  'Strong Potential',
  'viral',
  '["Viral", "High CTR", "Entertainment", "Challenges"]',
  '["Vlogs", "Challenges", "Viral content", "Reaction videos"]',
  'flux_1.1_pro',
  'Flux 1.1 Pro',
  '["gemini_3"]',
  'Style: YouTube High-CTR Photography, MrBeast aesthetic. Visuals: Hyper-realistic 8k photo, subject looking at camera with extreme emotion (shock, excitement, fear), eyes slightly widened and brightened. Lens: 16mm Wide-Angle (fisheye distortion) close-up. Colors: Saturated +20%, ${BRAND_COLOR} as background accent. Composition: Subject fills frame, rule of thirds. Text Rule: Render the text "${TEXT}" floating next to the head in massive "Impact" font with thick black stroke (5px) and drop shadow. Lighting: Harsh studio "rim lighting" (backlight) to separate subject, high contrast. Technical: 8k resolution, hyper-realistic skin texture, crunchy detail. Aspect Ratio: 16:9. Mood: Viral, shocking, high energy, click-worthy.',
  'Render as massive Impact font with thick black stroke next to head',
  9,
  true,
  false
);

-- 10. Sticker Bomb (Gen Z/TikTok Collage)
INSERT INTO style_gallery (
  style_id, name, description, tier, tier_label, category,
  best_for, use_cases,
  recommended_model, model_display_name, alternate_models,
  prompt_template, text_integration_rule,
  sort_order, is_active, is_experimental
) VALUES (
  'sticker_bomb',
  'Sticker Bomb',
  'Chaotic Gen Z collage aesthetic with sticker art and floating emojis. Perfect for TikTok-style content and young audiences.',
  2,
  'Strong Potential',
  'viral',
  '["Gen Z", "TikTok", "Memes", "Youth Content"]',
  '["TikTok-style content", "Memes", "Youth-focused", "Chaotic energy"]',
  'ideogram_v2',
  'Ideogram v2',
  '[]',
  'Style: YouTube thumbnail composite, Gen Z sticker art collage aesthetic. Visuals: Main subject cut out with a thick white border (3-5px) creating a sticker effect, background explosion of floating 3D emojis (😱🔥💯), abstract geometric shapes, speed lines radiating outward, vibrant chaotic energy. Colors: High saturation, clashing neon colors (hot pink, electric blue, lime green), ${BRAND_COLOR} as accent. Composition: Asymmetric, energetic chaos, paper texture overlay for authenticity. Text Rule: Render the text "${TEXT}" as a large die-cut sticker in the foreground with a white stroke outline, grunge texture, slight peel effect on corners, bold sans-serif font. Lighting: Flat, evenly lit, no dramatic shadows, bright and punchy. Technical: Collage aesthetic, visible layer separation, TikTok/YouTube thumbnail style. Aspect Ratio: 16:9. Mood: Chaotic, fun, young audience, high energy, viral.',
  'Render as die-cut sticker with white outline and peel effect',
  10,
  true,
  false
);

-- 11. Double Exposure (Silhouette + Scene)
INSERT INTO style_gallery (
  style_id, name, description, tier, tier_label, category,
  best_for, use_cases,
  recommended_model, model_display_name, alternate_models,
  prompt_template, text_integration_rule,
  sort_order, is_active, is_experimental
) VALUES (
  'double_exposure',
  'Double Exposure',
  'Cinematic double exposure with silhouette head filled with a vibrant scene. Perfect for conceptual, artistic, and psychology content.',
  2,
  'Strong Potential',
  'artistic',
  '["Conceptual", "Artistic", "Psychology", "Philosophy"]',
  '["Mindset content", "Philosophy", "Abstract concepts", "Artistic storytelling"]',
  'gemini_3',
  'Gemini 3 (Nano Banana)',
  '[]',
  'Style: Cinematic Double Exposure photography. Visuals: Side profile silhouette of a human head, inside the silhouette is a vibrant landscape or scene related to the topic. Background: Pure solid white for maximum contrast. Colors: Vibrant scene inside silhouette, ${BRAND_COLOR} as accent. Composition: Profile silhouette on left or right third. Text Rule: Render the text "${TEXT}" in elegant serif font floating in the negative space outside the head, subtle and sophisticated. Lighting: High contrast, sharp transition lines between silhouette and background, surreal blend. Technical: Photographic quality, clean edges, artistic. Aspect Ratio: 16:9. Mood: Conceptual, artistic, introspective, surreal.',
  'Render as elegant serif font in negative space outside silhouette',
  11,
  true,
  false
);

-- 12. Knolling Grid (Overhead Flat Lay)
INSERT INTO style_gallery (
  style_id, name, description, tier, tier_label, category,
  best_for, use_cases,
  recommended_model, model_display_name, alternate_models,
  prompt_template, text_integration_rule,
  sort_order, is_active, is_experimental
) VALUES (
  'knolling_grid',
  'Knolling Grid',
  'Overhead flat lay with objects arranged in perfect 90-degree grid. Great for organization, reviews, and comparison content.',
  2,
  'Strong Potential',
  'tech',
  '["Organization", "Reviews", "Comparisons", "Tech Unboxing"]',
  '["Product reviews", "Organization tips", "Tech unboxing", "Comparison videos"]',
  'gemini_3',
  'Gemini 3 (Nano Banana)',
  '[]',
  'Style: Knolling photography, overhead flat lay. Composition: Overhead flat lay shot (90-degree angle from above), objects organized neatly in a grid pattern, symmetrical and spaced evenly, all items at 90-degree angles. Colors: Clean solid color background, ${BRAND_COLOR} as accent. Text Rule: Render the text "${TEXT}" as a centered label in the grid, integrated as if it''s another object in the arrangement. Lighting: Even studio lighting, no harsh shadows, flat and clean. Technical: High resolution, sharp focus, organized aesthetic. Aspect Ratio: 16:9. Mood: Organized, clean, satisfying, methodical.',
  'Render as centered label integrated into the grid layout',
  12,
  true,
  false
);

-- TIER 3: EXPERIMENTAL (3 styles)
-- "Mad Scientist Lab" - actively testing and perfecting

-- 13. Paper Diorama (Layered Papercraft)
INSERT INTO style_gallery (
  style_id, name, description, tier, tier_label, category,
  best_for, use_cases,
  recommended_model, model_display_name, alternate_models,
  prompt_template, text_integration_rule,
  sort_order, is_active, is_experimental
) VALUES (
  'paper_diorama',
  'Paper Diorama',
  'Whimsical layered papercraft with visible depth. Handcrafted aesthetic perfect for storytelling and cozy content. (Experimental: Texture refinement needed)',
  3,
  'Experimental',
  'artistic',
  '["Storytelling", "Crafts", "Nostalgic", "Cozy"]',
  '["Storytelling", "Crafts", "Nostalgic content", "Whimsical topics"]',
  'gemini_3',
  'Gemini 3 (Nano Banana)',
  '[]',
  'Style: Layered Papercraft Diorama, handmade aesthetic. Visuals: Objects appear made of cut construction paper with visible fiber texture, depth created by stacking layers at different distances, warm cozy color palette. Colors: Warm, cozy colors with ${BRAND_COLOR} as accent. Composition: Layered depth, multiple planes. Text Rule: Render the text "${TEXT}" as if cut out of white cardboard, standing up in the center of the diorama, casting shadows on layers behind. Lighting: Hard shadows cast by layers to show depth, warm cozy overhead lighting. Technical: Paper texture, visible layers, handcrafted feel. Aspect Ratio: 16:9. Mood: Whimsical, handcrafted, cozy, nostalgic.',
  'Render as white cardboard cutout standing in diorama center',
  13,
  true,
  true
);

-- 14. Neo-Brutalist (Ugly-Cool Web Design)
INSERT INTO style_gallery (
  style_id, name, description, tier, tier_label, category,
  best_for, use_cases,
  recommended_model, model_display_name, alternate_models,
  prompt_template, text_integration_rule,
  sort_order, is_active, is_experimental
) VALUES (
  'neo_brutalist',
  'Neo-Brutalist',
  'Raw, anti-design aesthetic with clashing colors and default fonts. Ironic and edgy. (Experimental: Niche appeal, hit-or-miss)',
  3,
  'Experimental',
  'artistic',
  '["Design Critique", "Internet Culture", "Edgy", "Ironic"]',
  '["Design critique", "Internet culture", "Edgy content", "Anti-establishment"]',
  'ideogram_v2',
  'Ideogram v2',
  '[]',
  'Style: Neo-Brutalism web design, anti-design aesthetic. Visuals: Stark plain rectangles, default system fonts (Courier, Times New Roman), high-contrast strokes (thick black outlines), clashing neon colors (neon green on hot pink). Colors: Clashing neon colors, ${BRAND_COLOR} as one of the clash colors. Composition: Asymmetric, intentionally awkward, raw. Text Rule: Render the text "${TEXT}" in a chaotic "Times New Roman" font inside a jagged warning box with thick black border, intentionally ugly. Shadows: Hard, unblurred black drop shadows. Technical: Raw, unpolished, ironic. Aspect Ratio: 16:9. Mood: Raw, anti-design, ironic, edgy, internet culture.',
  'Render in Times New Roman inside jagged warning box',
  14,
  true,
  true
);

-- 15. Retro VHS (90s Horror/Conspiracy)
INSERT INTO style_gallery (
  style_id, name, description, tier, tier_label, category,
  best_for, use_cases,
  recommended_model, model_display_name, alternate_models,
  prompt_template, text_integration_rule,
  sort_order, is_active, is_experimental
) VALUES (
  'retro_vhs',
  'Retro VHS',
  '90s VHS camcorder footage with scan lines and tracking errors. Perfect for horror, conspiracy, and retro content. (Experimental: Hardest to nail, needs iteration)',
  3,
  'Experimental',
  'artistic',
  '["Horror", "Conspiracy", "Retro", "Mystery"]',
  '["Horror content", "Conspiracy theories", "Retro gaming", "Mystery videos"]',
  'flux_1.1_pro',
  'Flux 1.1 Pro',
  '[]',
  'Style: 1990s VHS camcorder footage, analog horror aesthetic. Effects: Chromatic aberration, scan lines, static noise, tracking error glitch, washed out colors. Colors: Low fidelity, desaturated, ${BRAND_COLOR} heavily degraded. Composition: Slightly off-center, amateur camcorder feel. Text Rule: Render the text "${TEXT}" as a bright green VCR On-Screen Display (OSD) timestamp in the bottom left corner, pixelated font. Overlay: Green "REC" text and digital timestamp in top right. Lighting: Dark moody lighting, low fidelity, grainy. Technical: VHS artifacts, low resolution feel, analog degradation. Aspect Ratio: 16:9. Mood: Horror, conspiracy, retro, unsettling, nostalgic.',
  'Render as green VCR timestamp overlay in bottom left',
  15,
  true,
  true
);
