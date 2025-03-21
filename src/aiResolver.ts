import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: '2306d13657604ff0b851dd6c8bc6f0ed',
    baseURL: 'https://avaeast.openai.azure.com/'
});

export async function resolveMergeConflicts(conflicts: { current: string, incoming: string }[]): Promise<string | null> {
    try {
        const conflictText = conflicts.map((c, i) => 
            `Conflict ${i+1}:\nCurrent:\n${c.current}\nIncoming:\n${c.incoming}`
        ).join("\n\n");

        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are a software engineer resolving Git merge conflicts. Merge the following conflicting code intelligently."
                },
                {
                    role: "user",
                    content: conflictText
                }
            ],
            max_tokens: 300,
        });

        // **Safe Access Handling**
        if (!response || !response.choices || response.choices.length === 0) {
            console.error("AI response is empty or null.");
            return null;
        }

        // Extract and return AI-generated content
        const aiGeneratedMerge = response.choices[0].message?.content?.trim() || null;
        if (!aiGeneratedMerge) {
            console.error("AI-generated merge resolution is null.");
        }

        return aiGeneratedMerge;
    } catch (error) {
        console.error("Error resolving conflicts:", error);
        return null;
    }
}
