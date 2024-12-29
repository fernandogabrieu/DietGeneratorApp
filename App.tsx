import React, { useState, useEffect  } from "react";
import { View, Text, TextInput, Button, FlatList, StyleSheet, Alert, TouchableOpacity } from "react-native";
import { RadioButton } from "react-native-paper";
import { Picker } from "@react-native-picker/picker";

export default function App() {
  const [gender, setGender] = useState<"male" | "female" | null>(null);
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [tmb, setTmb] = useState<number | null>(null);
  const [ndc, setNdc] = useState<number | null>(null);
  const [activityLevel, setActivityLevel] = useState<string>("");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState("");
  const [dietSuggestion, setDietSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  //fatore baseado no nível de atividade do usuário
  const activityFactors: { [key: string]: number } = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    athlete: 1.9,
  };


  // Calcula o TMB e NDC automaticamente quando todos os dados forem preenchidos ou algum dado preenchido for alterado
  useEffect(() => {
    if (gender && weight && height && age && activityLevel) {
      const tmbValue =
        gender === "male"
          ? 88.36 + 13.4 * parseFloat(weight) + 4.8 * parseFloat(height) - 5.7 * parseFloat(age)
          : 447.6 + 9.2 * parseFloat(weight) + 3.1 * parseFloat(height) - 4.3 * parseFloat(age);
      setTmb(Math.round(tmbValue));

      const ndcValue = tmbValue * activityFactors[activityLevel];
      setNdc(Math.round(ndcValue));
    } else {
      setTmb(null);
      setNdc(null);
    }
  }, [gender, weight, height, age, activityLevel]);

  //Função para gerar a dieta
  const generateDiet = async () => {
    if(ingredients.length === 0){
      alert("Por favor, adicione ingredientes antes de gerar a dieta")
      return;
    }else if(!activityLevel){
      alert("Por favor, selecione um nível de atividade física para calcular o TMB e NDC antes de gerar a dieta.");
      return;
    }else if(!tmb || !ndc){
      alert("Por favor, preencha todos os dados para calcular o TMB e NDC antes de gerar a dieta.");
      return;
    }
  
    setLoading(true);
    //Substituir pela key do OpenRouter
    const apiKey = "A_CHAVE_DA_API_AQUI";  
  
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "Você é um especialista em nutrição e sugere dietas personalizadas.",
            },
            {
              role: "user",
              content: `Baseado nos seguintes ingredientes: ${ingredients.join(
                    ", "
                  )}, sugira uma dieta personalizada de ${ndc} Kcal totais no seguinte formato de resposta:  

                **Sugestão de Dieta:**  
                Com base nas informações fornecidas, sugiro a seguinte dieta personalizada:  

                ==Café da Manhã==  
                - [alimentos com base na lista e no NDC]  
                **Total de Kcal no café da manhã:** XXX kcal  

                ==Lanche da Manhã==  
                - [alimentos com base na lista e no NDC]  
                **Total de Kcal no lanche da manhã:** XXX kcal  

                ==Almoço==  
                - [alimentos sugeridos com base na lista e no NDC]  
                **Total de Kcal no almoço:** XXX kcal  

                ==Lanche da Tarde==  
                - [alimentos sugeridos com base na lista e no NDC]  
                **Total de Kcal no lanche da tarde:** XXX kcal  

                ==Jantar==  
                - [alimentos sugeridos com base na lista e no NDC]  
                **Total de Kcal no jantar:** XXX kcal  

                **Total de calorias da dieta:** XXXX kcal  
   
                Para melhorar a dieta, você pode adicionar mais alimentos saudáveis.  

                Se necessário, preencha os dados novamente e gere outra sugestão personalizada.  
              `,
            },
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      //Verificação da resposta da requisição à API
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erro na API do OpenRouter:", errorData);
        alert(`Erro: ${errorData.error || "Falha ao gerar a dieta."}`);
        return;
      }

      const data = await response.json();
      console.log("Resposta da API OpenRouter:", data);
      setDietSuggestion(data.choices[0].message.content.trim());
    } catch (error) {
      console.error("Erro ao chamar a API do OpenRouter:", error);
      alert("Houve um erro ao gerar a dieta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  //Função só pra adicionar um ingrediente na lista
  const addIngredient = () => {
    if (newIngredient.trim()) {
      setIngredients((prev) => [...prev, newIngredient.trim()]);
      setNewIngredient("");
    }
  };

  //função para remover ingrediente da lista
  const removeIngredient = (ingredient: string) => {
    setIngredients((prev) => prev.filter((item) => item !== ingredient));
  };

  return (
    <FlatList
  data={ingredients}
  keyExtractor={(item, index) => index.toString()}
  renderItem={({ item }) => (
    <View style={styles.ingredientRow}>
      <Text style={styles.ingredient}>{item}</Text>
      <TouchableOpacity onPress={() => removeIngredient(item)}>
        <Text style={styles.removeButton}>Remover</Text>
      </TouchableOpacity>
    </View>
  )}
  ListHeaderComponent={
    <View style={styles.container}>
      <Text style={styles.title}>Dieta Generator!</Text>

      <Text style={styles.subtitle}>Gênero:</Text>
      <View style={styles.row}>
        <View style={styles.radioItem}>
          <RadioButton
            value="male"
            status={gender === "male" ? "checked" : "unchecked"}
            onPress={() => setGender("male")}
          />
          <Text>Sou homem</Text>
        </View>
        <View style={styles.radioItem}>
          <RadioButton
            value="female"
            status={gender === "female" ? "checked" : "unchecked"}
            onPress={() => setGender("female")}
          />
          <Text>Sou mulher</Text>
        </View>
      </View>

      <View style={styles.row}>
        <TextInput
          placeholder="Peso (kg)"
          keyboardType="numeric"
          style={styles.inputSmall}
          value={weight}
          onChangeText={setWeight}
        />
        <TextInput
          placeholder="Altura (cm)"
          keyboardType="numeric"
          style={styles.inputSmall}
          value={height}
          onChangeText={setHeight}
        />
        <TextInput
          placeholder="Idade"
          keyboardType="numeric"
          style={styles.inputSmall}
          value={age}
          onChangeText={setAge} 
        />
      </View>

      <Text style={styles.subtitle}>Qual seu nível de atividade física?</Text>
      <Picker
        selectedValue={activityLevel}
        onValueChange={(itemValue) => setActivityLevel(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="Selecionar" value="" />
        <Picker.Item label="Sedentário" value="sedentary" />
        <Picker.Item label="Levemente ativo" value="lightly_active" />
        <Picker.Item label="Moderadamente ativo" value="moderately_active" />
        <Picker.Item label="Muito ativo" value="very_active" />
        <Picker.Item label="Atleta" value="athlete" />
      </Picker>

      {ndc && <Text style={styles.result}>Seu número diário de calorias a serem consumidas (NDC) é: {ndc} Kcal</Text>}

      <Text style={styles.subtitle}>Ingredientes para dieta:</Text>
      <TextInput
        placeholder="Adicionar ingrediente"
        style={styles.input}
        value={newIngredient}
        onChangeText={setNewIngredient}
      />
      <TouchableOpacity onPress={addIngredient}>
        <Text style={styles.addButton}>Adicionar Ingrediente</Text>
      </TouchableOpacity>
    </View>
  }
  ListFooterComponent={
    <View>
      <Button title="Gerar dieta" onPress={generateDiet} disabled={loading} />
      {loading && <Text>Gerando dieta...</Text>}
      {dietSuggestion && (
        <View style={styles.resultBox}>
          <Text style={styles.subtitle}>Sugestão de Dieta:</Text>
          <Text>{dietSuggestion}</Text>
        </View>
      )}
    </View>
  }
/>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  radioItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputSmall: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    width: "30%",
  },
  picker: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  result: {
    fontSize: 16,
    fontWeight: "bold",
    marginVertical: 10,
  },
  ingredientRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 5,
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 5,
  },
  ingredient: {
    fontSize: 16,
  },
  removeButton: {
    color: "red",
    fontWeight: "bold",
  },
  resultBox: {
    marginTop: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    backgroundColor: "#f9f9f9",
  },  
  addButton: {
    color: "blue",
    textAlign: "center",
    fontWeight: "bold",
    marginVertical: 10,
  },
});
