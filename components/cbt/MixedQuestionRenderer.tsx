"use client";

import React, { useState, useEffect } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface QuestionRendererProps {
  question: any;
  index: number;
  onAnswer: (answer: any) => void;
  savedAnswer?: any;
}

export function MixedQuestionRenderer({
  question,
  index,
  onAnswer,
  savedAnswer
}: QuestionRendererProps) {
  const [answer, setAnswer] = useState(savedAnswer);

  useEffect(() => {
    if (savedAnswer) setAnswer(savedAnswer);
  }, [savedAnswer]);

  const handleAnswerChange = (value: any) => {
    setAnswer(value);
    onAnswer(value);
  };

  const renderByType = () => {
    switch(question.type) {
      case 'MCQ_SINGLE':
        return renderMultipleChoiceSingle();
      case 'MCQ_MULTIPLE':
        return renderMultipleChoiceMultiple();
      case 'FILL_BLANK':
        return renderFillInTheBlank();
      case 'TRUE_FALSE':
        return renderTrueFalse();
      case 'SHORT_ANSWER':
        return renderShortAnswer();
      default:
        return (
          <div className="text-center p-8 bg-red-50 rounded-lg">
            <p className="text-red-800">Unsupported question type.</p>
          </div>
        );
    }
  };

  const renderMultipleChoiceSingle = () => {
    return (
      <RadioGroup
        value={answer}
        onValueChange={handleAnswerChange}
        className="space-y-3"
      >
        {question.options?.map((option: string, idx: number) => {
          const letter = String.fromCharCode(65 + idx);
          return (
            <div key={idx} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all">
              <RadioGroupItem value={letter} id={`q${index}_${letter}`} className="text-purple-600 border-purple-300" />
              <Label
                htmlFor={`q${index}_${letter}`}
                className="flex-1 cursor-pointer font-medium text-slate-700"
              >
                <span className="font-bold mr-2 text-purple-600">{letter}.</span>
                {option.replace(/^[A-D][.)]\s*/, '')}
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    );
  };

  const renderMultipleChoiceMultiple = () => {
    const selectedAnswers = Array.isArray(answer) ? answer : [];

    const toggleOption = (optionLetter: string) => {
      const newAnswers = selectedAnswers.includes(optionLetter)
        ? selectedAnswers.filter(a => a !== optionLetter)
        : [...selectedAnswers, optionLetter];
      handleAnswerChange(newAnswers);
    };

    return (
      <div className="space-y-3">
        {question.options?.map((option: string, idx: number) => {
          const letter = String.fromCharCode(65 + idx);
          return (
            <div key={idx} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all">
              <Checkbox
                id={`q${index}_${letter}`}
                checked={selectedAnswers.includes(letter)}
                onCheckedChange={() => toggleOption(letter)}
                className="text-purple-600 border-purple-300"
              />
              <Label
                htmlFor={`q${index}_${letter}`}
                className="flex-1 cursor-pointer font-medium text-slate-700"
              >
                <span className="font-bold mr-2 text-purple-600">{letter}.</span>
                {option.replace(/^[A-D][.)]\s*/, '')}
              </Label>
            </div>
          );
        })}
        <Alert className="mt-4 bg-purple-50 border-purple-100 text-purple-800">
          <AlertDescription className="font-medium">
            Select all that apply. This question may have multiple correct answers.
          </AlertDescription>
        </Alert>
      </div>
    );
  };

  const renderFillInTheBlank = () => {
    const parts = question.text.split(/\[BLANK_\d+\]|________+|_{3,}/);
    const [blankAnswers, setBlankAnswers] = useState<string[]>(
      Array.isArray(answer) ? answer : new Array(parts.length - 1).fill('')
    );

    const updateBlankAnswer = (blankIndex: number, value: string) => {
      const newAnswers = [...blankAnswers];
      newAnswers[blankIndex] = value;
      setBlankAnswers(newAnswers);
      handleAnswerChange(newAnswers);
    };

    return (
      <div className="space-y-4">
        <div className="text-lg leading-relaxed text-slate-800 font-medium">
          {parts.map((part: string, idx: number) => (
            <React.Fragment key={idx}>
              <span>{part}</span>
              {idx < parts.length - 1 && (
                <Input
                  type="text"
                  placeholder={`Blank ${idx + 1}`}
                  value={blankAnswers[idx] || ''}
                  onChange={(e) => updateBlankAnswer(idx, e.target.value)}
                  className="inline-block w-48 mx-2 px-3 py-1 border-b-4 border-t-0 border-l-0 border-r-0 border-purple-200 focus:border-purple-600 focus:ring-0 rounded-none bg-transparent h-10 transition-colors font-bold text-center"
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  const renderTrueFalse = () => {
    return (
      <RadioGroup
        value={answer}
        onValueChange={handleAnswerChange}
        className="flex gap-6"
      >
        <div className="flex items-center space-x-2 p-4 border rounded-xl hover:bg-slate-50 transition-all cursor-pointer">
          <RadioGroupItem value="True" id={`${index}_true`} className="text-emerald-600 border-emerald-300" />
          <Label htmlFor={`${index}_true`} className="font-bold text-emerald-700 cursor-pointer">TRUE</Label>
        </div>
        <div className="flex items-center space-x-2 p-4 border rounded-xl hover:bg-slate-50 transition-all cursor-pointer">
          <RadioGroupItem value="False" id={`${index}_false`} className="text-rose-600 border-rose-300" />
          <Label htmlFor={`${index}_false`} className="font-bold text-rose-700 cursor-pointer">FALSE</Label>
        </div>
      </RadioGroup>
    );
  };

  const renderShortAnswer = () => {
    return (
      <textarea
        value={answer || ''}
        onChange={(e) => handleAnswerChange(e.target.value)}
        placeholder="Type your detailed answer here..."
        rows={6}
        className="w-full p-4 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-600 transition-all outline-none font-medium"
      />
    );
  };

  return (
    <Card className="mb-10 overflow-hidden border-2 border-slate-100 shadow-xl shadow-slate-100 rounded-[2rem]">
      <CardContent className="p-10">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="px-4 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-black uppercase tracking-wider">
              Question {index + 1}
            </span>
            {question.marks > 1 && (
              <span className="px-4 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-black uppercase tracking-wider">
                {question.marks} Points
              </span>
            )}
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 leading-tight">
            {question.text}
          </div>
        </div>

        <div className="mt-10">
          {renderByType()}
        </div>

        {question.explanation && (
          <div className="mt-8 p-6 bg-blue-50/50 border border-blue-100 rounded-2xl text-sm text-blue-700 leading-relaxed font-medium">
            <span className="font-black text-blue-900 uppercase tracking-widest text-[10px] block mb-2">Explanatory Note:</span>
            {question.explanation}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
