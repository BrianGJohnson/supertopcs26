import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedSupabase } from "@/lib/supabase-server";

/**
 * Save onboarding progress after each step
 * POST /api/onboarding/save
 * 
 * Body:
 * {
 *   step: number (1-6),
 *   data: { ... step-specific data }
 * }
 * 
 * Step 1: Welcome (no data)
 * Step 2: Goals/Motivations
 * Step 3: Money Focus (monetization methods, details, channel info)
 * Step 4: Niche & Topics
 * Step 5: Pillars (AI-generated, saved after review)
 * Step 6: Audience
 */
export async function POST(request: NextRequest) {
  try {
    // Get current user from auth header
    const { supabase, userId } = await createAuthenticatedSupabase(request);
    if (!userId || !supabase) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { step, data } = await request.json();

    if (!step || step < 1 || step > 6) {
      return NextResponse.json(
        { error: "Invalid step" },
        { status: 400 }
      );
    }

    // Get or create the user's default channel
    let { data: channel, error: channelError } = await supabase
      .from("channels")
      .select("*")
      .eq("user_id", userId)
      .eq("is_default", true)
      .single();

    if (channelError || !channel) {
      // Create default channel if doesn't exist
      const { data: newChannel, error: createError } = await supabase
        .from("channels")
        .insert({
          user_id: userId,
          name: "My Channel",
          is_default: true,
          onboarding_step: 1,
        })
        .select()
        .single();

      if (createError) {
        console.error("Failed to create channel:", createError);
        return NextResponse.json(
          { error: "Failed to create channel" },
          { status: 500 }
        );
      }
      channel = newChannel;
    }

    // Build update object based on step
    const updateData: Record<string, unknown> = {
      onboarding_step: step,
      updated_at: new Date().toISOString(),
    };

    switch (step) {
      case 1:
        // Welcome - save display mode preference to user_profiles (user-level setting)
        if (data.display_mode) {
          const { error: profileError } = await supabase
            .from("user_profiles")
            .upsert({ 
              user_id: userId,
              display_mode: data.display_mode,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });
          
          if (profileError) {
            console.error("Failed to save display mode:", profileError);
          }
        }
        break;

      case 2:
        // Goals/Motivations
        if (data.motivations) updateData.motivations = data.motivations;
        if (data.primaryMotivation) updateData.primary_motivation = data.primaryMotivation;
        break;

      case 3:
        // Money Focus - CRITICAL data for GPT pillar generation
        if (data.monetizationMethods) updateData.monetization_methods = data.monetizationMethods;
        if (data.monetizationPriority) updateData.monetization_priority = data.monetizationPriority;
        if (data.productsDescription) updateData.products_description = data.productsDescription;
        if (data.affiliateProducts) updateData.affiliate_products = data.affiliateProducts;
        if (data.adsenseStatus) updateData.adsense_status = data.adsenseStatus;
        if (data.sponsorshipNiche) updateData.sponsorship_niche = data.sponsorshipNiche;
        if (typeof data.hasChannel === 'boolean') updateData.has_channel = data.hasChannel;
        if (data.channelUrl) updateData.youtube_channel_url = data.channelUrl;
        break;

      case 4:
        // Niche, Content Style & Topics
        if (data.niche) updateData.niche = data.niche;
        if (data.contentStyle) updateData.content_style = data.contentStyle;
        if (data.contentStyleName) updateData.content_style_name = data.contentStyleName;
        if (data.videoFormats) updateData.video_formats = data.videoFormats;
        if (data.topicIdeas) updateData.topic_ideas = data.topicIdeas;
        break;

      case 5:
        // Pillars (AI-generated, saved after user reviews with selected sub-niches)
        if (data.pillar_strategy) updateData.pillar_strategy = data.pillar_strategy;
        if (data.pillarStrategy) updateData.pillar_strategy = data.pillarStrategy; // Support both cases
        if (data.niche_demand_score) updateData.niche_demand_score = data.niche_demand_score;
        if (data.nicheDemandScore) updateData.niche_demand_score = data.nicheDemandScore; // Support both cases
        if (data.niche_validated !== undefined) updateData.niche_validated = data.niche_validated;
        else updateData.niche_validated = true;
        break;

      case 6:
        // Audience
        if (data.audienceWhoHelp) updateData.audience_who = data.audienceWhoHelp;
        if (data.audienceWho) updateData.audience_who = data.audienceWho; // Legacy support
        if (data.audienceStruggle) updateData.audience_struggle = data.audienceStruggle;
        if (data.audienceGoal) updateData.audience_goal = data.audienceGoal;
        if (data.audienceExpertise) updateData.audience_expertise = data.audienceExpertise;
        // Mark onboarding complete
        updateData.onboarding_completed_at = new Date().toISOString();
        break;
    }

    // Update the channel
    const { error: updateError } = await supabase
      .from("channels")
      .update(updateData)
      .eq("id", channel.id);

    if (updateError) {
      console.error("Failed to save onboarding data:", updateError);
      return NextResponse.json(
        { error: "Failed to save progress" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      step,
      channelId: channel.id,
    });
  } catch (error) {
    console.error("Onboarding save error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Get current onboarding progress
 * GET /api/onboarding/save
 */
export async function GET(request: NextRequest) {
  try {
    // Get current user from auth header
    const { supabase, userId } = await createAuthenticatedSupabase(request);
    if (!userId || !supabase) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the user's default channel
    const { data: channel, error: channelError } = await supabase
      .from("channels")
      .select("*")
      .eq("user_id", userId)
      .eq("is_default", true)
      .single();

    if (channelError || !channel) {
      // No channel yet, start fresh
      return NextResponse.json({
        onboardingStep: 1,
        onboardingCompleted: false,
        data: null,
      });
    }

    return NextResponse.json({
      onboardingStep: channel.onboarding_step || 1,
      onboardingCompleted: !!channel.onboarding_completed_at,
      data: {
        // Step 2: Motivations
        motivations: channel.motivations,
        primaryMotivation: channel.primary_motivation,
        // Step 3: Money Focus
        monetizationMethods: channel.monetization_methods,
        monetizationPriority: channel.monetization_priority,
        productsDescription: channel.products_description,
        affiliateProducts: channel.affiliate_products,
        adsenseStatus: channel.adsense_status,
        sponsorshipNiche: channel.sponsorship_niche,
        hasChannel: channel.has_channel,
        channelUrl: channel.youtube_channel_url,
        // Step 4: Niche & Topics
        niche: channel.niche,
        topicIdeas: channel.topic_ideas,
        // Step 5: Pillars
        pillarStrategy: channel.pillar_strategy,
        nicheDemandScore: channel.niche_demand_score,
        nicheValidated: channel.niche_validated,
        // Step 6: Audience
        audienceWho: channel.audience_who,
        audienceStruggle: channel.audience_struggle,
        audienceGoal: channel.audience_goal,
        audienceExpertise: channel.audience_expertise,
      },
    });
  } catch (error) {
    console.error("Onboarding get error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
