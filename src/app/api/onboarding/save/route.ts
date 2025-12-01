import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * Save onboarding progress after each step
 * POST /api/onboarding/save
 * 
 * Body:
 * {
 *   step: number (1-4),
 *   data: { ... step-specific data }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { step, data } = await request.json();

    if (!step || step < 1 || step > 4) {
      return NextResponse.json(
        { error: "Invalid step" },
        { status: 400 }
      );
    }

    // Get or create the user's default channel
    let { data: channel, error: channelError } = await supabase
      .from("channels")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_default", true)
      .single();

    if (channelError || !channel) {
      // Create default channel if doesn't exist
      const { data: newChannel, error: createError } = await supabase
        .from("channels")
        .insert({
          user_id: user.id,
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
      case 2:
        // Goals & Channel
        if (data.goals) updateData.goals = data.goals;
        if (data.channelUrl) updateData.youtube_channel_url = data.channelUrl;
        break;

      case 3:
        // Niche & Pillars
        if (data.niche) updateData.niche = data.niche;
        if (data.nicheScore) updateData.niche_score = data.nicheScore;
        if (data.pillars) updateData.content_pillars = data.pillars;
        if (data.nicheAnalysis) updateData.niche_analysis = data.nicheAnalysis;
        break;

      case 4:
        // Audience
        if (data.audienceWho) updateData.audience_who = data.audienceWho;
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
export async function GET() {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the user's default channel
    const { data: channel, error: channelError } = await supabase
      .from("channels")
      .select("*")
      .eq("user_id", user.id)
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
        goals: channel.goals,
        channelUrl: channel.youtube_channel_url,
        niche: channel.niche,
        nicheScore: channel.niche_score,
        pillars: channel.content_pillars,
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
