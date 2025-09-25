import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateConversationStatusDto {
  @IsEnum(['active', 'closed', 'pending'], {
    message: 'Trạng thái phải là active, closed, hoặc pending',
  })
  @IsNotEmpty()
  status: 'active' | 'closed' | 'pending';
}