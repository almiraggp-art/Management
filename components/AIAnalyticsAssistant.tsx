import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Sparkles, LoaderCircle, AlertTriangle } from 'lucide-react';

interface AIAnalyticsAssistantProps {
  data: any;
  businessType: 'printing' | 'rental';
}

export const AIAnalyticsAssistant: React.FC<AIAnalyticsAssistantProps> = ({ data, businessType }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const examplePrompts = {
    printing: [
      "What was my best selling product by revenue?",
      "Summarize sales for the last 7 days.",
      "What is the average transaction value?",
    ],
    rental: [
      "Who are my top 3 customers by points?",
      "How many points were redeemed in total?",
      "What was the total purchase amount for all customers?",
    ]
  };

  const handleAskAI = async (prompt?: string) => {
    const currentQuery = prompt || query;
    if (!currentQuery) return;

    setIsLoading(true);
    setResponse('');
    setError('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Sanitize data slightly to reduce token count for large datasets
      const summarizedData = Array.isArray(data) ? data.slice(0, 100) : data;
      const dataString = JSON.stringify(summarizedData);
      
      const systemInstruction = `You are a helpful business analytics assistant for a small business owner. Analyze the following JSON data and answer the user's question concisely. Provide data-driven insights and format your response clearly using markdown-style headings, lists, and bold text. The data represents the ${businessType} business. All monetary values are in PHP (₱). Today's date is ${new Date().toLocaleDateString()}.`;

      const fullPrompt = `
          Context: The user is asking for an analysis of their business data.
          
          BUSINESS DATA (JSON format):
          \`\`\`json
          ${dataString}
          \`\`\`

          USER QUESTION:
          "${currentQuery}"

          Please answer the user's question based *only* on the provided data.
      `;
      
      const genAIResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: fullPrompt,
          config: {
              systemInstruction: systemInstruction,
              temperature: 0.1,
          }
      });

      setResponse(genAIResponse.text);

    } catch (e) {
      console.error(e);
      setError("Sorry, an error occurred while analyzing the data. Please check the console for details and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAskAI();
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 mt-6">
      <div className="flex items-center gap-3 mb-4">
        <Sparkles className="w-6 h-6 text-blue-500" />
        <h3 className="font-semibold text-lg text-slate-900 dark:text-white">AI Analytics Assistant</h3>
      </div>

      <div className="space-y-4">
        <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-2">
            <Input 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about your sales, products, or customers..."
                className="flex-grow"
                disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !query} className="sm:w-auto w-full">
                {isLoading ? <LoaderCircle className="animate-spin mr-2" size={16} /> : <Sparkles className="mr-2" size={16} />}
                Ask AI
            </Button>
        </form>
        <div className="flex flex-wrap gap-2">
            {examplePrompts[businessType].map(prompt => (
                <button 
                    key={prompt}
                    onClick={() => { setQuery(prompt); handleAskAI(prompt); }}
                    disabled={isLoading}
                    className="text-xs px-2.5 py-1.5 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 transition disabled:opacity-50"
                >
                    {prompt}
                </button>
            ))}
        </div>
        
        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg min-h-[150px] border border-slate-200 dark:border-slate-700 flex items-center justify-center">
            {isLoading && (
                <div className="text-center text-slate-500 dark:text-slate-400">
                    <LoaderCircle className="animate-spin mx-auto mb-2" />
                    <p>Analyzing your data...</p>
                </div>
            )}
            {error && (
                <div className="text-center text-red-500 dark:text-red-400">
                    <AlertTriangle className="mx-auto mb-2" />
                    <p>{error}</p>
                </div>
            )}
            {!isLoading && !error && response && (
                <div className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap w-full">
                    {response}
                </div>
            )}
            {!isLoading && !error && !response && (
                <div className="text-center text-slate-500 dark:text-slate-400">
                    <p>Your insights will appear here.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
