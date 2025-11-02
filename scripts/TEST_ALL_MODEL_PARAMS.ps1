# PowerShell Test Script for Model Parameters
# Tests all 17 AI models to verify parameter configuration

$baseUrl = "http://localhost:8080"

$models = @(
    "anthropic/claude-sonnet-4.5"
    "google/gemini-2.5-pro"
    "x-ai/grok-4-fast"
    "deepseek/deepseek-chat-v3.1"
    "openai/gpt-5"
    "openai/gpt-5-mini"
    "openai/gpt-oss-120b"
    "minimax/minimax-m2"
    "z-ai/glm-4.6"
    "qwen/qwen3-max"
    "openai/gpt-4.1-mini"
    "openai/gpt-5-codex"
    "openai/gpt-oss-20b"
    "openai/o3"
    "openai/gpt-4.1"
    "openai/o3-mini"
)

Write-Host "`n🧪 Testing Model Parameter Configuration`n" -ForegroundColor Cyan
Write-Host "Testing $($models.Count) models..." -ForegroundColor Gray
Write-Host "API: $baseUrl`n" -ForegroundColor Gray

$totalPasses = 0
$totalFails = 0

foreach ($model in $models) {
    Write-Host "`n$('='*80)" -ForegroundColor DarkGray
    Write-Host "🔍 Testing: $model" -ForegroundColor Yellow
    Write-Host "$('-'*80)" -ForegroundColor DarkGray
    
    try {
        # Call API
        $encodedModel = [System.Web.HttpUtility]::UrlEncode($model)
        $response = Invoke-RestMethod -Uri "$baseUrl/api/model-config?model_id=$encodedModel" -Method Get
        
        # Display config
        Write-Host "Model Type: $($response.model_type)" -ForegroundColor Cyan
        Write-Host "Supports Temperature: $($response.supports_temperature)" -ForegroundColor $(if ($response.supports_temperature) {"Green"} else {"Red"})
        Write-Host "Supports Verbosity: $($response.supports_verbosity)" -ForegroundColor $(if ($response.supports_verbosity) {"Green"} else {"Red"})
        Write-Host "Supports Reasoning Effort: $($response.supports_reasoning_effort)" -ForegroundColor $(if ($response.supports_reasoning_effort) {"Green"} else {"Red"})
        
        Write-Host "`nDefault Parameters:" -ForegroundColor White
        $response.default_parameters | ConvertTo-Json -Depth 3 | Write-Host -ForegroundColor Gray
        
        # Verify GPT-5 (NO temperature)
        if ($model -like "*gpt-5*" -and $model -notlike "*oss*") {
            if ($response.default_parameters.temperature) {
                Write-Host "❌ FAIL: GPT-5 should NOT have temperature" -ForegroundColor Red
                $totalFails++
            } else {
                Write-Host "✅ PASS: GPT-5 correctly has NO temperature" -ForegroundColor Green
                $totalPasses++
            }
            
            if ($response.default_parameters.verbosity) {
                Write-Host "✅ PASS: GPT-5 has verbosity" -ForegroundColor Green
                $totalPasses++
            } else {
                Write-Host "❌ FAIL: GPT-5 missing verbosity" -ForegroundColor Red
                $totalFails++
            }
        }
        
        # Verify o3 models (NO temperature, NO verbosity)
        if ($model -like "*o3*") {
            if ($response.default_parameters.temperature) {
                Write-Host "❌ FAIL: o3 should NOT have temperature" -ForegroundColor Red
                $totalFails++
            } else {
                Write-Host "✅ PASS: o3 correctly has NO temperature" -ForegroundColor Green
                $totalPasses++
            }
            
            if ($response.default_parameters.verbosity) {
                Write-Host "❌ FAIL: o3 should NOT have verbosity" -ForegroundColor Red
                $totalFails++
            } else {
                Write-Host "✅ PASS: o3 correctly has NO verbosity" -ForegroundColor Green
                $totalPasses++
            }
            
            if ($response.default_parameters.reasoning_effort) {
                Write-Host "✅ PASS: o3 has reasoning_effort" -ForegroundColor Green
                $totalPasses++
            } else {
                Write-Host "❌ FAIL: o3 missing reasoning_effort" -ForegroundColor Red
                $totalFails++
            }
        }
        
        # Verify Claude (has temperature + top_k)
        if ($model -like "*claude*") {
            if ($response.default_parameters.temperature) {
                Write-Host "✅ PASS: Claude has temperature" -ForegroundColor Green
                $totalPasses++
            } else {
                Write-Host "❌ FAIL: Claude missing temperature" -ForegroundColor Red
                $totalFails++
            }
            
            if ($response.default_parameters.top_k) {
                Write-Host "✅ PASS: Claude has top_k" -ForegroundColor Green
                $totalPasses++
            } else {
                Write-Host "❌ FAIL: Claude missing top_k" -ForegroundColor Red
                $totalFails++
            }
        }
        
        # Verify Gemini (has max_output_tokens)
        if ($model -like "*gemini*") {
            if ($response.default_parameters.max_output_tokens) {
                Write-Host "✅ PASS: Gemini has max_output_tokens" -ForegroundColor Green
                $totalPasses++
            } else {
                Write-Host "❌ FAIL: Gemini missing max_output_tokens" -ForegroundColor Red
                $totalFails++
            }
        }
        
        # Verify Grok (has web_search)
        if ($model -like "*grok*" -or $model -like "*x-ai*") {
            if ($response.default_parameters.web_search) {
                Write-Host "✅ PASS: Grok has web_search" -ForegroundColor Green
                $totalPasses++
            } else {
                Write-Host "❌ FAIL: Grok missing web_search" -ForegroundColor Red
                $totalFails++
            }
        }
        
        # Check for max_tokens or max_completion_tokens
        if ($response.default_parameters.max_tokens -or $response.default_parameters.max_completion_tokens -or $response.default_parameters.max_output_tokens) {
            $tokenValue = $response.default_parameters.max_tokens ?? $response.default_parameters.max_completion_tokens ?? $response.default_parameters.max_output_tokens
            Write-Host "✅ PASS: Has token limit ($tokenValue)" -ForegroundColor Green
            $totalPasses++
        } else {
            Write-Host "❌ FAIL: Missing token limit" -ForegroundColor Red
            $totalFails++
        }
        
    } catch {
        Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
        $totalFails++
    }
}

# Final Summary
Write-Host "`n$('='*80)" -ForegroundColor DarkGray
Write-Host "📊 FINAL SUMMARY" -ForegroundColor Cyan
Write-Host "$('='*80)" -ForegroundColor DarkGray
Write-Host "Models tested: $($models.Count)" -ForegroundColor White
Write-Host "Total checks passed: $totalPasses" -ForegroundColor Green
Write-Host "Total checks failed: $totalFails" -ForegroundColor Red

if (($totalPasses + $totalFails) -gt 0) {
    $successRate = ($totalPasses / ($totalPasses + $totalFails)) * 100
    Write-Host "Success rate: $([math]::Round($successRate, 1))%" -ForegroundColor $(if ($successRate -ge 90) {"Green"} elseif ($successRate -ge 70) {"Yellow"} else {"Red"})
}

Write-Host "$('='*80)" -ForegroundColor DarkGray

if ($totalFails -eq 0) {
    Write-Host "`n🎉 All models passed all checks!" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Some models have failed checks. Review above." -ForegroundColor Yellow
}

Write-Host ""

