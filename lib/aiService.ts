import axios from 'axios';

export const callAI = async (userPrompt: string) => {
  // Check if the prompt is a direct filename
  const filenameMatch = userPrompt.match(/^(\w+)\.(pdf|txt|jpg|png|mp4|mp3)$/i);
  if (filenameMatch) {
    const [, name, ext] = filenameMatch;
    const actionMap: { [key: string]: string } = {
      pdf: 'create_pdf',
      txt: 'create_txt',
      jpg: 'create_image',
      png: 'create_image',
      mp4: 'create_video',
      mp3: 'create_audio',
    };
    return { action: actionMap[ext.toLowerCase()], name: userPrompt };
  }

  const systemPrompt = `You are an AI file manager. Interpret the user's natural language prompt and respond with a JSON object containing the action and parameters. Possible actions: create_pdf, create_txt, create_image, create_video, create_audio, delete_file, create_folder. For create actions, extract the filename with extension. For delete, extract the filename. If the prompt is just a filename with extension (e.g., "file.pdf"), assume it's a create action based on the extension. If unclear, set action to 'unknown'. Response format: {"action": "action_name", "name": "extracted_name"}`;

  try {
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'x-ai/grok-4.1-fast',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 100,
    }, {
      headers: {
        'Authorization': `Bearer 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`,
      },
    });
    const data = response.data;
    const aiMessage = data.choices[0].message.content;
    return JSON.parse(aiMessage);
  } catch (error) {
    console.error('AI call failed:', error);
    return { action: 'unknown' };
  }
};